
    obs = fromEventPattern() --> Observable

    O = obs.pipe(multicast(new Subject()), refCount()) --> Observable       // new Subject(): Subject to push source elements into.
        
    subs = O.subscribe(m => console.log(m)) --> Subscription





    takeUntil<T>(notifier: Observable<any>): MonoTypeOperatorFunction<T>




- We want to able to have multiple subscribers for one MIDI input.
    - We need to have a multicast observable
        - We use a _Subject_.
            - One subject per MIDI input.
                - Array (Object) of subject with input's ID as key.

