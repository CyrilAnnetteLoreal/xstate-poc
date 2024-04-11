import { setup } from 'xstate';

const debug = ({ context }, params) => {
  if (!context.debug) return;
  console.log(params);
}

const navigate = ({ context, event }, params) => {
  let { moduleId, stepId } = event?.data ?? {};
  /* params values override event values */
  if (params) {
    moduleId = params.moduleId;
    stepId = params.stepId;
  }

  /* use current step / module if not specified */
  if (!moduleId && stepId) {
    moduleId = context.routes.current.moduleId;
  }
  else if (!stepId && moduleId) {
    stepId = context.config.modules.find(m => m.id === moduleId)?.steps?.[0]?.id; // first module step
  }

  debug({ context }, `- Navigating to route ${moduleId}::${stepId}`);

  if (moduleId) context.routes.current.moduleId = moduleId;
  context.routes.current.module = context.config.modules.find(m => m.id === moduleId);

  if (stepId) context.routes.current.stepId = stepId;
  context.routes.current.step = context.routes.current.module.steps.find(s => s.id === stepId);

  /* Previous destination */
  context.routes.previous = {
    moduleId: context.routes.current.step?.navigation?.previous?.route?.module,
    stepId: context.routes.current.step?.navigation?.previous?.route?.step,
  };

  /* Next destination */
  context.routes.next = {
    moduleId: context.routes.current.step?.navigation?.next?.route?.module,
    stepId: context.routes.current.step?.navigation?.next?.route?.step,
  };

  /* onRestart destination */
  if (context.routes.current.module?.events?.onRestart) {
    context.routes.restart = {
      moduleId: context.routes.current.module?.events?.onRestart?.route?.module,
      stepId: context.routes.current.module?.events?.onRestart?.route?.step,
    };
  }

  /* onError destination */
  if (context.routes.current.module?.events?.onError) {
    context.routes.error = {
      moduleId: context.routes.current.module?.events?.onError?.route?.module,
      stepId: context.routes.current.module?.events?.onError?.route?.step,
    };
  }

}

export default setup({
  actions: {

    /* Config injection */
    readConfig: ({ context, event }) => {
      const { data = {} } = event;
      context.config = data; // inject config into the context
      debug(({ context, event }), '- Configuration loaded');

      const firstModuleId = context.config?.modules?.[0]?.id;
      const firstStepId = context.config.modules?.[0].steps?.[0]?.id;

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
      context.output.history = [];
    },
    appendCurrentOutput: ({ context, event }) => {
      const { data } = event;
      context.output.current = { ...context.output.current, ...data }
      debug({ context }, `- Storing ${JSON.stringify(data)} into output`);
    },
    readLastInput: ({ context }) => {
      context.input.current = context.output.history.slice(-1)[0];
    },
  }
})
  .createMachine({
    id: 'flow',
    context: ({ input }) => {
      const { debug = false } = input;
      return {
        debug,
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
      complete: {
        entry: [
          ({ context, event }) => {
            debug(({ context, event }), '- Experience completed');
          }
        ]
      }
    },
  });
