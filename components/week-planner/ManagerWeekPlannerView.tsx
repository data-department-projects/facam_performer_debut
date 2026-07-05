"use client";

import { TeamPlannerReviewList, useValidatablePlanners } from "./TeamPlannerReviewList";
import type { TeamMember } from "./types";

type Props = {
  members: TeamMember[];
};

export function ManagerWeekPlannerView({ members: initialMembers }: Readonly<Props>) {
  const { members, handleValidate } = useValidatablePlanners(initialMembers);

  return (
    <TeamPlannerReviewList
      members={members}
      onValidate={handleValidate}
      title="Week Planners de mon équipe"
      emptyMessage="Aucun membre dans votre équipe."
    />
  );
}
