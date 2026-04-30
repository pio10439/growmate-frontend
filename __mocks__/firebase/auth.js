export const getAuth = jest.fn(() => ({}));

export const signInWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({ user: { uid: "test-user" } }),
);

export const createUserWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({ user: { uid: "test-user" } }),
);
