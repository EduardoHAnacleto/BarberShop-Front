// Minimal type declaration for the Google Identity Services (GSI) SDK.
// The full SDK is loaded asynchronously via the script in nuxt.config.ts head;
// these types prevent TypeScript errors when accessing window.google on the
// login page. Only the subset used by the application is typed here.
interface Window {
  google?: {
    accounts: {
      id: {
        // Initialises the GSI client with the given configuration.
        initialize: (config: {
          client_id: string
          callback: (response: { credential: string }) => void
        }) => void
        // Renders the One Tap / Sign In With Google button into a container.
        renderButton: (
          parent: HTMLElement,
          options: { theme?: string; size?: string; width?: number },
        ) => void
      }
    }
  }
}
