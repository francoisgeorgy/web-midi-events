import * as WebMidi from "webmidi";
import {bindCallback, Subject} from "rxjs";
import {multicast, refCount} from "rxjs/operators";

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

    function selectorFunction(param1, param2) {
        return {param1, param2};
    }


    const obs = bindCallback(WebMidi.inputs[i].addListener, selectorFunction);    //.bind(WebMidi.inputs[i]);
    // console.log("obs", obs);

    var observable = observableFactory('username', 'password');

    const refCounted = obs.pipe(multicast(new Subject()), refCount());
    const subscription1 = refCounted.subscribe(m => console.log("multicasted subject 1", m));
    // const subscription2 = refCounted.subscribe(m => console.log("multicasted subject 2", m));

    setTimeout(() => {
        console.log("subscription1.unsubscribe()");
        subscription1.unsubscribe();
    }, 2000);
    // setTimeout(() => {
    //     console.log("subscription2.unsubscribe()");
    //     subscription2.unsubscribe();
    // }, 4000);
    // let subscription3;
    // setTimeout(() => {
    //     console.log("subscription3.subscribe()");
    //     subscription3 = refCounted.subscribe(m => console.log("multicasted subject 3", m));
    // }, 6000);


    /*
        // const messages = addInputListener("midimessage", "all");
        const messages = obs.call(WebMidi.inputs[i],"midimessage", "all");

        messages.subscribe(
            m => console.log("midimessage", m),
            e => console.error(e)
        );
    */

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
