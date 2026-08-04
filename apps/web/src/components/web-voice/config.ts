// Deliberately empty. This used to default to the upstream vendor's voice service, which
// meant that with no environment variable set -- the state this deployment is in -- every
// browser test call streamed a customer's microphone to a company that is not us. An
// unset endpoint is a feature that says it is unconfigured; a stranger's endpoint is a
// feature that appears to work.
const DEFAULT_WEB_CALL_ENDPOINT = "";
const LOCAL_WEB_CALL_ENDPOINT =
  "http://127.0.0.1:3001/web-call/sessions";

export const DASHBOARD_TEST_CALL_WIDGET_ID = "reception-dashboard-test-call";
export const PROSPECT_DEMO_WIDGET_ID = "reception-prospect-demo";

export function getWebCallEndpoint(): string {
  if (import.meta.env.VITE_WEB_CALL_ENDPOINT) {
    return import.meta.env.VITE_WEB_CALL_ENDPOINT;
  }

  if (import.meta.env.DEV) {
    return LOCAL_WEB_CALL_ENDPOINT;
  }

  return DEFAULT_WEB_CALL_ENDPOINT;
}
