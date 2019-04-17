import {fromEvent, fromEventPattern, Observable, Subject} from "rxjs";
import {multicast, refCount, map} from "rxjs/operators";

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

            console.log("create observable");

            const obs = fromEventPattern(
                handler => {    // called each time we subscribe to this Observable. So, only the latest subscriber will be notified.
                    console.log("fromEventPattern: set onmidimessage");
                    p.onmidimessage = handler
                },
                handler => {
                    console.log("fromEventPattern: unset onmidimessage (set to null)");
                    p.onmidimessage = null
                }
            );

            console.log("create refCounted");

            // multicast: Returns an Observable that emits the results of invoking a specified selector on items emitted
            //            by a ConnectableObservable that shares a single subscription to the underlying stream.

            const refCounted = obs.pipe(multicast(new Subject()), refCount());

            // const subscription1 = refCounted.subscribe(m => console.log("multicasted subject 1", m));

            console.log("o2");

            let o2 = new Observable(obs=> {

                const o2s = refCounted.subscribe(m => {
                    console.log("o2: multicasted subject 1", m);
                    obs.next(m);
                    // obs.complete();
                });

                return () => {
                    console.log("o2 teardown");
                    o2s.unsubscribe();
                }

            });

            console.log("s2");

            const s2 = o2.pipe(map((m) => {console.log("o2 map"); return m})).subscribe(x => console.log("s2", x));
            // const s2 = o2.subscribe(x => console.log("s2", x));

            setTimeout(() => {console.log("s2.unsubscribe()"); s2.unsubscribe();}, 4000);


            /*
             //
             // Example 1
             //
                        //TODO: add error and complete handlers
                        // const myObserver = {
                        //     next: x => console.log('Observer got a next value: ' + x),
                        //     error: err => console.error('Observer got an error: ' + err),
                        //     complete: () => console.log('Observer got a complete notification'),
                        // };
                        //
                        // // Execute with the observer object
                        // myObservable.subscribe(myObserver);

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
            */

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
    }

    // listInputsAndOutputs();

    console.groupEnd();
}

function onMIDISuccess(midiAccess) {
    log("Got access to MIDI");
    W3CMidi = midiAccess;
    W3CMidi.onstatechange = onStateChange;
    // listInputsAndOutputs();
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
