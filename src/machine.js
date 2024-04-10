import { setup } from 'xstate';

const navigate = ({ context, event }, params) => {
  let { moduleId, stepId } = event.data ?? {};
  if (params) {
    moduleId = params.moduleId;
    stepId = params.stepId;
  }

  /* use current step / module if not specified */
  if (!moduleId && stepId) {
    moduleId = context.routes.current.moduleId;
  }
  else if (!stepId && moduleId) {
    stepId = context.routes.current.stepId;
  }

  /* Previous destination */
  context.routes.previous = {
    moduleId: context.routes.current.moduleId,
    stepId: context.routes.current.stepId,
  };

  if (moduleId) context.routes.current.moduleId = moduleId;
  context.routes.current.module = context.config.modules[context.routes.current.moduleId];

  if (stepId) context.routes.current.stepId = stepId;
  context.routes.current.step = context.currentModule.steps[context.routes.current.stepId];

  /* Next destination */
  context.routes.next = {
    moduleId: context.routes.current.step.navigation.next.route.module,
    stepId: context.routes.current.step.navigation.next.route.step,
  };

  /* onRestart destination */
  context.routes.restart = {
    moduleId: context.routes.current.module.events.onRestart.route.module,
    stepId: context.routes.current.module.events.onRestart.route?.step,
  };

  /* onError destination */
  context.routes.error = {
    moduleId: context.routes.current.module.events.onError.route.module,
    stepId: context.routes.current.module.events.onError.route?.step,
  };
}

export default setup({
  actions: {

    /* Config injection */
    readConfig: ({ context, event }) => {
      const { data = {} } = event;
      context.config = data; // inject config into the context

      const firstModuleId = Object.keys(context.config?.modules)?.[0];
      const firstStepId = Object.keys(context.config.modules[firstModuleId].steps)[0];

      navigate({ context }, {
        moduleId: firstModuleId,
        stepId: firstStepId,
      })
    },

    /* Navigation */
    navigate,
    next: ({ context }) => {
      navigate({ context }, {
        moduleId: context.routes.next.moduleId,
        stepId: context.routes.next.stepId,
      })
    },
    previous: ({ context }) => {
      navigate({ context }, {
        moduleId: context.routes.previous.moduleId,
        stepId: context.routes.previous.stepId,
      })
    },
    restart: ({ context }) => {
      navigate({ context }, {
        moduleId: context.routes.restart.moduleId,
        stepId: context.routes.restart.stepId,
      })
    },
    fallback: ({ context }) => {
      navigate({ context }, {
        moduleId: context.routes.error.moduleId,
        stepId: context.routes.error.stepId,
      })
    },

    /* Input / Output management */
    storeCurrentOutput: ({ context }) => {
      context.output.history = [...context.output.history, { ...context.output.current }];
    },
    clearCurrentOutput: ({ context }) => {
      context.output.current = {};
    },
    clearOutputHistory: ({ context }) => {
      context.output.chistory = [];
    },
    appendCurrentOutput: ({ context, event }) => {
      const { data } = event;
      context.output.current = { ...context.output.current, ...data }
    },
    readLastInput: ({ context }) => {
      context.input.current = context.output.history.slice(-1)[0];
    },
  }
})
  .createMachine({
    id: 'flow',
    context: ({ input }) => {
      // const { moduleId, stepId = 0 } = input;
      return {
        config: {},
        routes: {
          current: {
            moduleId: 0, module: {},
            stepId: 0, step: {},
          },
          next: {},
          previous: {},
          restart: {},
          error: {},
        },
        input: {
          current: {}
        },
        output: {
          current: {},
          history: [],
        },
      }
    },
    initial: 'idle',
    states: {
      idle: {
        on: {
          'INIT': {
            target: 'ready',
            actions: [
              { type: 'readConfig' },
            ]
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
              { type: 'clearCurrentOutput' },
            ]
          },
          'NEXT': {
            actions: [
              { type: 'storeCurrentOutput' },
              { type: 'next' },
              { type: 'readLastInput' },
              { type: 'clearCurrentOutput' },
            ]
          },
          'PREVIOUS': {
            actions: [
              { type: 'previous' },
              { type: 'clearCurrentOutput' },
            ]
          },
          'RESTART': {
            actions: [
              { type: 'restart' },
              { type: 'clearCurrentOutput' },
              { type: 'clearOutputHistory' },
            ]
          },
          'ERROR': {
            actions: [
              { type: 'fallback' },
              { type: 'clearCurrentOutput' },
              { type: 'clearOutputHistory' },
            ]
          },
          'SAVE_FORM': {
            actions: [{ type: 'appendCurrentOutput' }]
          },
          'COMPLETE': {
            target: 'complete',
            actions: [{ type: 'storeCurrentOutput' }]
          }
        },
      },
      complete: {}
    },
  });
