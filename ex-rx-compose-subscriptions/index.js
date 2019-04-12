const { fromEvent, of, Subject, Subscription } = rxjs;
const { map, multicast, refCount } = rxjs.operators;

const clicks = fromEvent(document, 'click');   // Observable

const clicksMulticast = clicks.pipe(multicast(new Subject()), refCount());     // Observable

// const parent = clicksMulticast.subscribe(m => console.log("1", m));
// const parent = clicksMulticast.subscribe(() => {});
const parent = new Subscription();
const child1 = clicksMulticast.subscribe(m => console.log("1", m));
const child2 = clicksMulticast.subscribe(m => console.log("2", m));
const child3 = clicksMulticast.subscribe(m => console.log("3", m));
const child4 = clicksMulticast.subscribe(m => console.log("4", m));

parent.add(child1);   // child1 will be automagically unsubscribed when parent is unsubscribed.
parent.add(child2);
parent.add(child3);
parent.add(child4);

setTimeout(() => { console.log("child1.unsubscribe()"); child1.unsubscribe(); }, 4000);
setTimeout(() => { console.log("child2.unsubscribe()"); child2.unsubscribe(); }, 6000);

setTimeout(() => { console.log("parent.unsubscribe()"); parent.unsubscribe(); }, 10000);
