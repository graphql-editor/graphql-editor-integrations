export class GlobalError extends Error {
  constructor(public message: string, public path: string) {
    super(message);
  }
}

export const errMiddleware = async <T>(handler: () => Promise<T>): Promise<T | { response: { error: unknown } }> => {
  try {
    return await handler();
  } catch (e) {
    if (e instanceof GlobalError) {
      return {
        response: {
          error: {
            message: e.message,
            path: e.path,
          },
        },
      };
    }
    return { response: { error: { message: `unknown error: ${e}` } } };
  }
};
