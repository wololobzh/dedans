export type ActorContext = {
  userId: string;
  permissions: string[];
  campusIds?: string[];
  unrestrictedCampusManagement?: boolean;
  correlationId?: string;
};
