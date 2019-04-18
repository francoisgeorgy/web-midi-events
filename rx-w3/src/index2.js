import {bindCallback, fromEvent, fromEventPattern, Subject} from "rxjs";
import {multicast, refCount} from "rxjs/operators";

console.log("index2");

var W3CMidi = null;  // global MIDIAccess object

const inputs = {};  // array of Subject representing MIDI input streams

const midi_messages = {};

function padZero(str, len, char) {
    let s = "";
    let c = char || "0";
    let n = (len || 2) - str.length;
    while (s.length < n) s += c;
    return s + str;
}

function h(v) {
    return (v === null || v === undefined) ? "" : padZero(v.toString(16).toUpperCase(), 2);
}

function hs(data) {
    return (data === null || data === undefined) ? "" : (Array.from(data).map(n => h(n))).join(" ");    // Array.from() is necessary to get a non-typed array
}

function log(msg) {
    console.log(msg);
}

function listInputsAndOutputs() {

    if (W3CMidi === null) return;

    // noinspection JSUnresolvedVariable
    let iter = W3CMidi.inputs.values();
    for (let o = iter.next(); !o.done; o = iter.next()) {
        let i = o.value;
        log(`in  connection ${i.connection}: ${i.name}`)
    }

    // noinspection JSUnresolvedVariable
    iter = W3CMidi.outputs.values();
    for (let o = iter.next(); !o.done; o = iter.next()) {
        let i = o.value;
        log(`out connection ${i.connection}: ${i.name}`)
    }
}

/*
        function setInputListeners() {
            let inputs = W3CMidi.inputs.values();
            for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                console.log(`setInputListeners: add onMidiMessageHandler for input "${input.value.name}"`);
                input.value.onmidimessage = onMidiMessage;
            }
        }
*/

function onMidiMessage(message) {
    if (message instanceof MIDIMessageEvent) {
        let bytes = message.data;       // type is Uint8Array
        let channel = bytes[0] & 0x0F;  // MIDI channel
        let type = bytes[0] & 0xF0;     // MIDI event type
        let port = message.currentTarget;
        log(message.type + " data: [" + hs(bytes) + "] channel: " + channel + " source: " + port.name);
    } else {
        log(message.type + ': ' + hs(message.data));
    }
}

function createObservable(port) {
    if (!port) return;
    const name = port.name;
    if (midi_messages[name]) {
        log(`observable already exists for ${name}`);
        return;
    }
    midi_messages[name] = fromEvent(port, "onmidimessage");
    log(`+ created Observable for ${name}`);
}

function subscribe(port) {
    const name = port.name;
    if (midi_messages[name]) {
        midi_messages[name].subscribe(m => console.log(m));
        log(`+ subscribed to ${name}`);
    }
}

function onStateChange(event) {

    console.group(`! ${event.type}: ${event.port.state} ${event.port.type} ${event.port.name} connection ${event.port.connection}`);

    const p = event.port;

    if (p.state === "connected" && p.connection !== "open") {
        // Handle the connection
        if (p.type === "input") {
            // if (!p.onmidimessage) {
            //     p.onmidimessage = onMidiMessage;
            //     log(`+ ${p.name} input listener added`);
            // }
            // createObservable(p);
            // subscribe(p);
            // console.log(p.onmidimessage);

            console.log("create observable");

            const SRC = fromEventPattern(
                handler => {    // called each time we subscribe to this Observable. So, only the latest subscriber will be notified.
                    console.log("fromEventPattern: set onmidimessage");
                    p.onmidimessage = handler
                },
                handler => {
                    console.log("fromEventPattern: unset onmidimessage (set to null)");
                    p.onmidimessage = null
                }
            );
            // const SRC = fromEvent(p, "onmidimessage");
            // const S1 = SRC.subscribe(m => console.log("S1", m));
            // const S2 = SRC.subscribe(m => console.log("S2", m));
            // console.log(p.onmidimessage);
            // S.unsubscribe();
            // console.log(p.onmidimessage);

            console.log("create subject");

            /*
            const subject = new Subject();
            subject.subscribe(m => console.log("subject 1", m));
            subject.subscribe(m => console.log("subject 2", m));

            console.log("subject subscribes to observable");
            SRC.subscribe(subject);

            subject.unsubscribe()
            */

            /*

            without refCount

            const multicasted = SRC.pipe(multicast(new Subject(), SRC));
            const subscription1 = multicasted.subscribe(m => console.log("multicasted subject 1", m));
            const subscription2 = multicasted.subscribe(m => console.log("multicasted subject 2", m));

            const multicastSubscription = multicasted.connect();

            setTimeout(() => {
                console.log("subscription1.unsubscribe()");
                subscription1.unsubscribe();
            }, 2000);
            setTimeout(() => {
                console.log("subscription2.unsubscribe()");
                subscription2.unsubscribe();

                console.log("multicastSubscription.unsubscribe()");
                multicastSubscription.unsubscribe();
            }, 3000);
            */

            /*
            statechange: connected input VMPK Output connection closed
            create observable
            create subject
            fromEventPattern: set onmidimessage
            statechange: connected output VMPK Input connection closed
            statechange: connected input VMPK Output connection open
            subscription1.unsubscribe()
            subscription2.unsubscribe()
            multicastSubscription.unsubscribe()
            fromEventPattern: unset onmidimessage (set to null)
            statechange: disconnected input VMPK Output connection pending
            statechange: disconnected output VMPK Input connection closed
            */

            // without refCount

            const refCounted = SRC.pipe(multicast(new Subject()), refCount());
            const subscription1 = refCounted.subscribe(m => console.log("multicasted subject 1", m));
            const subscription2 = refCounted.subscribe(m => console.log("multicasted subject 2", m));

            setTimeout(() => {
                console.log("subscription1.unsubscribe()");
                subscription1.unsubscribe();
            }, 2000);
            setTimeout(() => {
                console.log("subscription2.unsubscribe()");
                subscription2.unsubscribe();
            }, 4000);

            let subscription3;
            setTimeout(() => {
                console.log("subscription3.subscribe()");
                subscription3 = refCounted.subscribe(m => console.log("multicasted subject 3", m));
            }, 6000);


        }
    } else if (p.state === "disconnected") {
        // Handle the disconnection
        if (p.type === "input") {
/*
            if (p.onmidimessage) {
                p.onmidimessage = null;
                log(`- ${p.name} input listener removed`);
            }
*/
        }
    // } else {
    //     log("-- " + p.type + ' "' + p.name + '" is in an unknown state: ' + p.state);
    }

    // listInputsAndOutputs();

    console.groupEnd();
}

function onMIDISuccess(midiAccess) {
    log("Got access to MIDI");
    W3CMidi = midiAccess;
    W3CMidi.onstatechange = onStateChange;
    listInputsAndOutputs();
}

function onMIDIFailure(msg) {
    log("Failed to get MIDI access. " + msg);
}

document.addEventListener("DOMContentLoaded", function() {

    console.log("start");

    if (navigator.requestMIDIAccess) {
        console.log("requestMIDIAccess is available");
        // noinspection JSUnresolvedFunction
        navigator.requestMIDIAccess({ sysex: true }).then(
            onMIDISuccess,
            onMIDIFailure
        );
    } else {
        console.log("ERROR: navigator.requestMIDIAccess not supported");
    }

});
