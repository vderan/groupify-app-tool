import { updateIn, flatMap, zip, scaleToOne, firstResult } from './utils';
import { getExtensionData, setExtensionData } from './wcif-extensions';
import { suggestedGroupCount, suggestedScramblerCount, suggestedRunnerCount } from './formulas';
import { eventNameById } from './events';

export const parseActivityCode = activityCode => {
  const [, e, r, g, a] = activityCode.match(/(\w+)(?:-r(\d+))?(?:-g(\d+))?(?:-a(\d+))?/);
  return {
    eventId: e,
    roundNumber: r && parseInt(r, 10),
    groupNumber: g && parseInt(g, 10),
    attemptNumber: a && parseInt(a, 10)
  };
};

export const activityCodeToName = activityCode => {
  const { eventId, roundNumber, groupNumber, attemptNumber } = parseActivityCode(activityCode);
  return [
    eventId && eventNameById(eventId),
    roundNumber && `Round ${roundNumber}`,
    groupNumber && `Group ${groupNumber}`,
    attemptNumber && `Attempt ${attemptNumber}`
  ].filter(x => x).join(', ');
};

/* We store configuration in round activities.
   In case of FM and MBLD use the first attempt activity instead
   (as there's no top level round activity for these). */
export const isActivityConfigurable = activity => {
  const { eventId, roundNumber, groupNumber, attemptNumber } = parseActivityCode(activity.activityCode);
  return eventId && roundNumber && !groupNumber
    && (['333fm', '333mbf'].includes(eventId) ? attemptNumber === 1 : !attemptNumber);
};

export const activityDuration = activity =>
  new Date(activity.endTime) - new Date(activity.startTime)

const activityStations = (wcif, activity) => {
  const room = wcif.schedule.venues[0].rooms.find(room => room.activities.includes(activity));
  return getExtensionData('Room', room).stations;
};

export const populateActivitiesConfig = (wcif, expectedCompetitorsByRound, { assignScramblers, assignRunners, assignJudges }) => {
  const activities = flatMap(wcif.schedule.venues[0].rooms, room =>
    room.activities.filter(isActivityConfigurable)
  );
  const activitiesWithConfig = flatMap(wcif.events, wcifEvent => {
    return flatMap(wcifEvent.rounds, round => {
      const competitors = expectedCompetitorsByRound[round.id];
      const roundActivities = activities
        .filter(activity => activity.activityCode.startsWith(round.id));
      const capacities = scaleToOne(roundActivities.map(activity =>
        activityStations(wcif, activity) * activityDuration(activity)
      ));
      return zip(roundActivities, capacities).map(([activity, capacity]) => {
        const stations = activityStations(wcif, activity);
        return setExtensionData('Activity', activity, {
          capacity,
          groups: suggestedGroupCount(Math.round(capacity * competitors.length), stations),
          scramblers: assignScramblers ? suggestedScramblerCount(stations) : 0,
          runners: assignRunners ? suggestedRunnerCount(stations) : 0,
          assignJudges
        })
      });
    });
  });
  return activitiesWithConfig.reduce(updateActivity, wcif);
};

export const updateActivity = (wcif, updatedActivity) =>
  updateIn(wcif, ['schedule', 'venues', '0', 'rooms'], rooms =>
    rooms.map(room => ({
      ...room,
      activities: room.activities.map(activity => activity.id === updatedActivity.id ? updatedActivity : activity)
    }))
  );

export const anyActivityConfigured = wcif =>
  wcif.schedule.venues[0].rooms.some(room =>
    room.activities.some(activity => getExtensionData('Activity', activity))
  );

export const activitiesOverlap = (first, second) =>
  first.startTime < second.endTime && second.startTime < first.endTime;

const allActivities = wcif => {
  const allChildActivities = ({ childActivities }) =>
    childActivities.length > 0
      ? [...childActivities, ...flatMap(childActivities, allChildActivities)]
      : childActivities;
  const activities = flatMap(wcif.schedule.venues[0].rooms, room => room.activities);
  return [...activities, ...flatMap(activities, allChildActivities)];
};

export const maxActivityId = wcif =>
  Math.max(...allActivities(wcif).map(activity => activity.id));

const activityByIdRecursive = (activities, activityId) =>
  firstResult(activities, activity =>
    activity.id === activityId ? activity : activityByIdRecursive(activity.childActivities, activityId)
  );

export const activityById = (wcif, activityId) =>
  firstResult(wcif.schedule.venues[0].rooms, room =>
    activityByIdRecursive(room.activities, activityId)
  );
