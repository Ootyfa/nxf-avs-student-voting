import { AchievementTitle } from '../types';

export const getTitleFromPoints = (points: number): AchievementTitle => {
    if (points >= 301) return AchievementTitle.FestivalCritic;
    if (points >= 151) return AchievementTitle.FilmReviewer;
    if (points >= 51) return AchievementTitle.ActiveVoter;
    return AchievementTitle.Participant;
};

export const getNextMilestone = (points: number) => {
    if (points >= 301) {
        return {
            currentTitle: AchievementTitle.FestivalCritic,
            nextTitle: 'Jury Invitation',
            pointsNeeded: 0,
            progressPercent: 100,
            isMax: true
        };
    }
    if (points >= 151) {
        return {
            currentTitle: AchievementTitle.FilmReviewer,
            nextTitle: AchievementTitle.FestivalCritic,
            target: 301,
            pointsNeeded: 301 - points,
            progressPercent: ((points - 151) / (301 - 151)) * 100,
            isMax: false
        };
    }
    if (points >= 51) {
        return {
            currentTitle: AchievementTitle.ActiveVoter,
            nextTitle: AchievementTitle.FilmReviewer,
            target: 151,
            pointsNeeded: 151 - points,
            progressPercent: ((points - 51) / (151 - 51)) * 100,
            isMax: false
        };
    }
    return {
        currentTitle: AchievementTitle.Participant,
        nextTitle: AchievementTitle.ActiveVoter,
        target: 51,
        pointsNeeded: 51 - points,
        progressPercent: (points / 51) * 100,
        isMax: false
    };
};
