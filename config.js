export default {
    modules: [
      {
        id: '1',
        events: {
          onRestart: {
            route: { module: '1' }
          },
        },
        steps: [
          {
            id: '1_1',
            navigation: {
              next: {
                route: {
                  step: '1_2',
                }
              }
            }
          },
          {
            id: '1_2',
            navigation: {
              next: {
                route: {
                  module: '2',
                }
              },
              previous: {
                route: {
                  step: '1_1',
                }
              }
            }
          }
        ]
      },
      {
        id: '2',
        steps: [
          {
            id: '2_1',
            navigation: {
              next: {
                route: {
                  step: '2_2',
                }
              },
              previous: {
                route: {
                  module: '1',
                  step: '1_2',
                }
              }
            }
          },
          {
            id: '2_2',
            navigation: {
              previous: {
                route: {
                  step: '2_1',
                }
              }
            }
          }
        ]
      },
    ]
  }