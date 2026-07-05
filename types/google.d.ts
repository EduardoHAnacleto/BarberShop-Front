// Minimal type declaration for the Google Identity Services (GSI) SDK.
// The full SDK is loaded asynchronously via the script in nuxt.config.ts head;
// these types prevent TypeScript errors when accessing window.google on the
// login page. Only the subset used by the application is typed here.
interface Window {
  google?: {
    accounts: {
      id: {
        // Initialises the GSI client with the given configuration.
        // auto_select asks Google to silently re-sign-in returning users who
        // previously consented; itp_support enables Safari/Firefox ITP fallback.
        initialize: (config: {
          client_id: string
          callback: (response: { credential: string }) => void
          auto_select?: boolean
          cancel_on_tap_outside?: boolean
          itp_support?: boolean
          use_fedcm_for_prompt?: boolean
          context?: 'signin' | 'signup' | 'use'
        }) => void
        // Renders the One Tap / Sign In With Google button into a container.
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: string
            size?: string
            width?: number
            type?: 'standard' | 'icon'
            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
            logo_alignment?: 'left' | 'center'
          },
        ) => void
        // Triggers the One Tap prompt — Google's auto-login popup that uses the
        // account already signed into the device's browser. Optional callback
        // surfaces moment notifications (displayed, skipped, dismissed).
        prompt: (
          listener?: (notification: {
            isDisplayed?: () => boolean
            isNotDisplayed?: () => boolean
            isSkippedMoment?: () => boolean
            isDismissedMoment?: () => boolean
            getNotDisplayedReason?: () => string
            getSkippedReason?: () => string
            getDismissedReason?: () => string
          }) => void,
        ) => void
        // Disables auto-select for the next visit (call this on logout).
        disableAutoSelect: () => void
      }
    }
  }
}
