
- We want to able to have multiple subscribers for one MIDI input.
    - We need to have a multicast observable
        - We use a _Subject_.
            - One subject per MIDI input.
                - Array (Object) of subject with input's ID as key.

