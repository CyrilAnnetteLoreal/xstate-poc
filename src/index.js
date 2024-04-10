import fs from 'fs';
import { createActor } from 'xstate';

import machine from './machine.js';

const config = JSON.parse(fs.readFileSync('../config.json'));

const actor = createActor(machine, {
  input: { debug: true }
});

actor.subscribe({
  // next(snapshot) {
  //   if (snapshot.context.debug) {
  //     console.log(snapshot.context);
  //     console.log('-----------------------------');
  //   }
  // },
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