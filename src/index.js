import { createActor } from 'xstate';

import machine from './machine.js';
import config from '../config.js';

const actor = createActor(machine, {
  input: { debug: true }
});

actor.subscribe({
  next(snapshot) {
    if (snapshot.context.debug) {
      console.log(snapshot.context);
      console.log('############################## \n');
    }
  },
  error(err) {
    console.error(err);
    actor.send({ type: 'ERROR' });
  }
});

actor.start();

actor.send({ type: 'INIT', data: config });

actor.send({ type: 'SAVE_FORM', data: { test1: true, test2: false } });
actor.send({ type: 'NEXT' });

actor.send({ type: 'SAVE_FORM', data: { blahblah: "BLAHBLAH" } });
actor.send({ type: 'NEXT' });

actor.send({ type: 'COMPLETE' });