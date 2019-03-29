
import * as WebMidi from "webmidi";
import {bindCallback} from "rxjs";

function logMidiMessage(m) {
    console.log(m);
}

function addInputListeners() {

    console.log("addInputListeners");

    // WebMidi.inputs.map(function(port) {
    //     if (!port.hasListener("midimessage", "all", logMidiMessage)) {
    //         port.addListener("midimessage", "all", logMidiMessage);
    //         console.log(`${port.name} input listener added for "controlchange" event on all channels`);
    //     }
    // });

    // console.log(WebMidi.inputs, WebMidi.inputs.length);

    const i = WebMidi.inputs.length - 1;

    // console.log(WebMidi.inputs[i]);

    if (WebMidi.inputs[i].name !== "VMPK Output") {
        console.log("ignore " + WebMidi.inputs[i].name);
        return;
    }

    const addInputListener = bindCallback(WebMidi.inputs[i].addListener);
    // const messages = addInputListener("midimessage", "all");
    const messages = addInputListener.call(WebMidi.inputs[i],"midimessage", "all");

    messages.subscribe(
        m => console.log("midimessage", m),
        e => console.error(e)
    );

    // WebMidi.inputs.map(function(port) {

        // use bindCallback()
        // https://rxjs-dev.firebaseapp.com/api/index/function/bindCallback

    /*
        Observable.create<Data> { emitter ->
        SomeTask.execute(object: Callback() {

            override void onSuccess(data: Data) {
                emitter.onNext(data)
                emitter.onComplete()
            }

            override void onFailure(errorMessage: String) {
                // Here you must pass the Exception, not the message
                emitter.onError(exception)
            }
        }
    }
    */

    //     if (!port.hasListener("midimessage", "all", logMidiMessage)) {
    //         port.addListener("midimessage", "all", logMidiMessage);
    //         console.log(`${port.name} input listener added for "controlchange" event on all channels`);
    //     }
    // });
}

function removeInputListeners() {
    WebMidi.inputs.map(function(port) {
        port.removeListener();
        console.log(`${port.name} input listeners removed for all channels`);
    });
}

function onStateChange(event) {
    console.log("state change", event);

    if ((typeof event === 'undefined') || (event === null)) {
        console.warn("logMidiEvent: null or undefined event received");
        return;
    }

    if (event.port.type === 'input') {
        if (event.type === "connected") {
            addInputListeners();
        }
        if (event.type === "disconnected") {
            removeInputListeners();
        }
    }

}

document.addEventListener("DOMContentLoaded", function() {

    console.log("start");

    // noinspection JSUnresolvedFunction
    WebMidi.enable(function (err) {
        if (err) {
            console.warn("WebMidi could not be enabled", err);
            return;
        }
        console.log("Got access to MIDI");

        // noinspection JSUnresolvedFunction
        WebMidi.addListener("connected", onStateChange);

        // noinspection JSUnresolvedFunction
        WebMidi.addListener("disconnected", onStateChange);

    });


});
