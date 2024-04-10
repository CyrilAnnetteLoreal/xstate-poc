import { createActor } from 'xstate';
import machine from './machine.js';

const config = await import("../config.json", {
  with: { type: "json" },
});

const actor = createActor(machine, {
  // input: { moduleId: 1 }
});

const subscription = actor.subscribe({
  next(snapshot) {
    console.log(snapshot);
  },
  error(err) {
    actor.send({ type: 'ERROR' });
  },
  complete() {
    console.log('COMPLETE!', snapshot)
  },
});

actor.start();

actor.send({ type: 'INIT', data: config });

actor.send({ type: 'SAVE_FORM', data: { test1: true, test2: false } });
actor.send({ type: 'NEXT' });

actor.send({ type: 'SAVE_FORM', data: { blahblah: "BLAHBLAH" } });
actor.send({ type: 'NEXT' });

actor.send({ type: 'COMPLETE' });