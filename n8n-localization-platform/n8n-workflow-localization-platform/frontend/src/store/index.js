import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import workflowReducer from './workflowSlice';
import translationReducer from './translationSlice';
import packageReducer from './packageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workflow: workflowReducer,
    translation: translationReducer,
    package: packageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;