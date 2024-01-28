import { HostReportErrors } from "./types.mjs";

export const hostReportErrors: HostReportErrors = (error) => {
  throw error;
};
