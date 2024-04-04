import { setup } from 'xstate';

export default setup({
  actions: {
    navigate: ({ context, event }) => {
      const { moduleId, stepId }  = event.data ?? {};
      if (moduleId) context.moduleId = moduleId;
      if (stepId) context.stepId = stepId;
      context.currentOutput = {}; // clears current output
    },
    storeCurrentOutput: ({ context }) => {
      context.outputs = [...context.outputs, { ...context.currentOutput }];
    },
    readLastInput: ({ context }) => {
      context.lastInput = context.outputs.slice(-1)[0];
    },
    saveOutput: ({ context, event }) => {
      const { data } = event;
      context.currentOutput = { ...context.currentOutput, ...data }
    },
  }
})
  .createMachine({
    id: 'flow',
    context: ({ input }) => {
      const { moduleId, stepId = 0 } = input;
      return {
        lastInput: {},

        currentOutput: {},
        outputs: [],

        moduleId,
        stepId,
      }
    },
    initial: 'idle',
    states: {
      idle: {
        on: {
          'INIT': {
            target: 'ready',
          }
        }
      },
      ready: {
        on: {
          'NAVIGATE': {
            actions: [
              { type: 'storeCurrentOutput' },
              { type: 'navigate' },
              { type: 'readLastInput' },
            ]
          },
          'SAVE_OUTPUT': {
            actions: [{ type: 'saveOutput' }]
          },
          'COMPLETE': {
            target: 'complete',
            actions: [
              {type: 'saveOutput'},
              {type: 'storeCurrentOutput'},
            ]
          }
        },
      },
      complete: {}
    },
  });
