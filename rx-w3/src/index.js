import {bindCallback, fromEvent, fromEventPattern} from "rxjs";

var W3CMidi = null;  // global MIDIAccess object

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
            const O = fromEventPattern(
                handler => {    // called each time we subscribe to this Observable. So, only the latest subscriber will be notified.
                    console.log("fromEventPattern: set onmidimessage");
                    p.onmidimessage = handler
                },
                handler => p.onmidimessage = null
            );
            // const O = fromEvent(p, "onmidimessage");
            const S1 = O.subscribe(m => console.log("S1", m));
            const S2 = O.subscribe(m => console.log("S2", m));
            // console.log(p.onmidimessage);
            // S.unsubscribe();
            // console.log(p.onmidimessage);

        }
    } else if (p.state === "disconnected") {
        // Handle the disconnection
        if (p.type === "input") {
            if (p.onmidimessage) {
                p.onmidimessage = null;
                log(`- ${p.name} input listener removed`);
            }
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
