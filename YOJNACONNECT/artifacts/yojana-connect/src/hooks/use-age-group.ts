import { useState, useEffect } from "react";
import { ListSchemesAgeGroup } from "@workspace/api-client-react";

export function useAgeGroup() {
  const [ageGroup, setAgeGroupState] = useState<ListSchemesAgeGroup | null>(() => {
    const stored = localStorage.getItem("yojana-age-group");
    return stored ? (stored as ListSchemesAgeGroup) : null;
  });

  const setAgeGroup = (group: ListSchemesAgeGroup | null) => {
    if (group) {
      localStorage.setItem("yojana-age-group", group);
    } else {
      localStorage.removeItem("yojana-age-group");
    }
    setAgeGroupState(group);
  };

  return { ageGroup, setAgeGroup };
}
