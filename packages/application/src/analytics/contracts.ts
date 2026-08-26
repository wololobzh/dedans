export type ActiveLearnerMetric = {
  referenceDate: string;
  total: number;
  byCampus: Array<{ campusId: string; campusName: string; total: number }>;
};

export interface AnalyticsQueries {
  getActiveLearners(referenceDate: Date): Promise<ActiveLearnerMetric>;
}
