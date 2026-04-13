/**
 * matcher.js — scores volunteers against needs and returns ranked matches.
 *
 * Scoring (100 pts total):
 *   Skill match:    0–50 pts  (exact skill = 50, related category = 25, no match = 0)
 *   Proximity:      0–30 pts  (0–2 km = 30, 2–5 km = 20, 5–10 km = 10, >10 km = 0)
 *   Availability:   0–10 pts  (available now = 10, scheduled = 5, unavailable = 0)
 *   Experience:     0–10 pts  (based on tasks_completed count)
 */

// Skill category groupings — volunteers with related skills get partial credit
const SKILL_CATEGORIES = {
  food: ["food distribution", "cooking", "nutrition", "grocery", "meals"],
  medical: ["medical", "first aid", "nursing", "healthcare", "pharmacy", "doctor"],
  education: ["tutoring", "teaching", "education", "literacy", "training", "mentoring"],
  logistics: ["logistics", "transport", "driving", "delivery", "supply chain"],
  tech: ["technology", "it support", "computer", "software", "digital literacy"],
  counseling: ["counseling", "mental health", "support", "social work", "community"],
  construction: ["construction", "repair", "plumbing", "electrical", "maintenance"],
  general: ["general", "volunteer", "helper", "community service"],
};

/**
 * Returns which skill category a skill string belongs to.
 */
function getSkillCategory(skill) {
  const normalized = skill.toLowerCase().trim();
  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    if (keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))) {
      return category;
    }
  }
  return null;
}

/**
 * Calculates skill match score (0–50).
 */
function scoreSkills(volunteerSkills = [], needType = "") {
  const needNormalized = needType.toLowerCase().trim();
  const needCategory = getSkillCategory(needNormalized);

  for (const skill of volunteerSkills) {
    const skillNormalized = skill.toLowerCase().trim();
    // Exact match
    if (skillNormalized.includes(needNormalized) || needNormalized.includes(skillNormalized)) {
      return 50;
    }
    // Category match
    const skillCategory = getSkillCategory(skillNormalized);
    if (needCategory && skillCategory && needCategory === skillCategory) {
      return 25;
    }
  }
  return 0;
}

/**
 * Haversine formula — distance in km between two lat/lng points.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates proximity score (0–30).
 */
function scoreProximity(volunteerLat, volunteerLon, needLat, needLon) {
  if (!volunteerLat || !volunteerLon || !needLat || !needLon) return 10; // unknown = neutral
  const km = haversineKm(volunteerLat, volunteerLon, needLat, needLon);
  if (km <= 2) return 30;
  if (km <= 5) return 20;
  if (km <= 10) return 10;
  return 0;
}

/**
 * Calculates availability score (0–10).
 */
function scoreAvailability(availability = "available") {
  const map = { available: 10, scheduled: 5, unavailable: 0 };
  return map[availability.toLowerCase()] ?? 5;
}

/**
 * Calculates experience score (0–10).
 */
function scoreExperience(tasksCompleted = 0) {
  if (tasksCompleted >= 10) return 10;
  if (tasksCompleted >= 5) return 7;
  if (tasksCompleted >= 1) return 4;
  return 0;
}

/**
 * Matches a single need against all volunteers.
 *
 * @param {Object} need        - Need object with need_type, latitude, longitude
 * @param {Array}  volunteers  - Array of volunteer objects
 * @param {number} topN        - How many top matches to return
 * @returns {Array}            - Top N volunteers with scores, sorted descending
 */
function matchVolunteersToNeed(need, volunteers, topN = 3) {
  const scored = volunteers
    .filter((v) => v.availability !== "unavailable")
    .map((volunteer) => {
      const skillScore = scoreSkills(volunteer.skills, need.need_type);
      const proximityScore = scoreProximity(
        volunteer.latitude,
        volunteer.longitude,
        need.latitude,
        need.longitude
      );
      const availabilityScore = scoreAvailability(volunteer.availability);
      const experienceScore = scoreExperience(volunteer.tasks_completed);

      const totalScore = skillScore + proximityScore + availabilityScore + experienceScore;

      const distanceKm =
        volunteer.latitude && need.latitude
          ? Math.round(
              haversineKm(volunteer.latitude, volunteer.longitude, need.latitude, need.longitude) *
                10
            ) / 10
          : null;

      return {
        volunteer,
        score: totalScore,
        breakdown: {
          skill: skillScore,
          proximity: proximityScore,
          availability: availabilityScore,
          experience: experienceScore,
        },
        distance_km: distanceKm,
      };
    });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((result) => ({
      ...result,
      match_quality:
        result.score >= 70 ? "Excellent" : result.score >= 40 ? "Good" : "Possible",
    }));
}

/**
 * Matches all open needs against all volunteers — returns a map of need_id → top matches.
 */
function matchAllNeeds(needs, volunteers, topN = 3) {
  const results = {};
  for (const need of needs.filter((n) => n.status === "open")) {
    results[need.id] = matchVolunteersToNeed(need, volunteers, topN);
  }
  return results;
}

module.exports = { matchVolunteersToNeed, matchAllNeeds, haversineKm };
