/**
 * Public catalog copy for short clips and draft course outlines.
 * Paid lesson videos, workbooks, and Drive file ids do not belong here.
 */

export const DANGEROUS_LIES_PLAYLIST_ID = "PL2QfJI8adA_YOC37FdaYA0rCaTSNbyyk-";

export const CLIPS = [
  {
    id: "01",
    file: "01_everyone_but_me",
    title: "Somebody for Everyone… But Me?",
    youtube: "https://www.youtube.com/watch?v=wwcWniQFDA4&t=402s",
  },
  {
    id: "02",
    file: "02_scarcity_not_you",
    title: "Scarcity Doesn't Mean You Go Without",
    youtube: "https://www.youtube.com/watch?v=wwcWniQFDA4&t=713s",
  },
  {
    id: "03",
    file: "03_marriage_done_right",
    title: "Better Single Than Miserably Married",
    youtube: "https://www.youtube.com/watch?v=ddCC4qvPZgg&t=330s",
  },
  {
    id: "04",
    file: "04_discontent_every_season",
    title: "Enjoy the Season You're In",
    youtube: "https://www.youtube.com/watch?v=ddCC4qvPZgg&t=516s",
  },
  {
    id: "05",
    file: "05_spouse_not_your_source",
    title: "Your Spouse Is Not Your Source",
    youtube: "https://www.youtube.com/watch?v=ddCC4qvPZgg&t=745s",
  },
  {
    id: "06",
    file: "06_prepare_before_season",
    title: "Don't Wait to Prepare",
    youtube: "https://www.youtube.com/watch?v=6WsC_MOO3KI&t=1017s",
  },
  {
    id: "07",
    file: "07_desires_of_your_heart",
    title: "Read the Whole Verse (Psalm 37:4)",
    youtube: "https://www.youtube.com/watch?v=KIxtotAT0vU&t=360s",
  },
  {
    id: "08",
    file: "08_so_spiritual_story",
    title: "I Thought I Was Too Spiritual to Get It Wrong",
    youtube: "https://www.youtube.com/watch?v=KIxtotAT0vU&t=306s",
  },
];

export const COURSE_TRACKS = [
  {
    id: "single-dating",
    slot: "singleDating",
    page: "courses/single-dating.html",
    title: "Single and Dating",
    subtitle: "Preparing for the One",
    audience: "For singles who want to date with purpose and prepare for marriage.",
    description:
      "Draft outline for the Single and Dating track from Tayo and Kemi. Lessons are coming soon, and enrollment opens when the payment link is ready.",
    modules: [
      {
        title: "Truth over lies",
        lessons: [
          "Common lies singles believe",
          "What the Word says instead",
          "Healing from past relationships",
        ],
      },
      {
        title: "Becoming whole first",
        lessons: ["Identity in Christ", "Readiness for marriage", "Purpose and calling"],
      },
      {
        title: "Recognizing the right one",
        lessons: [
          "Character over chemistry",
          "Values, faith, and vision alignment",
          "Red and green flags",
        ],
      },
      {
        title: "Dating with purpose",
        lessons: [
          "Boundaries and purity",
          "Involving mentors and family",
          "The roadmap from single to married",
        ],
      },
    ],
  },
  {
    id: "committed",
    slot: "committed",
    page: "courses/committed.html",
    title: "Committed Relationship",
    subtitle: "Building a Strong Foundation",
    audience: "For couples in a serious relationship who are discerning marriage.",
    description:
      "Draft outline for the Committed Relationship track. Module titles are public. Lesson videos stay private until enrollment opens.",
    modules: [
      {
        title: "Knowing each other deeply",
        lessons: [
          "Family backgrounds and expectations",
          "Love languages and temperaments",
          "Faith as a couple",
        ],
      },
      {
        title: "Communication and conflict",
        lessons: ["Healthy communication", "Fighting fair", "Forgiveness and repair"],
      },
      {
        title: "Values, money, and vision",
        lessons: ["Finances and stewardship", "Career and life goals", "Children and family plans"],
      },
      {
        title: "Discerning the next step",
        lessons: ["Are we ready?", "Seeking wise counsel", "Boundaries until the wedding"],
      },
    ],
  },
  {
    id: "engaged-first-year",
    slot: "engagedFirstYear",
    page: "courses/engaged-first-year.html",
    title: "Engaged / First Year of Marriage",
    subtitle: "Launching Well",
    audience: "For engaged couples and newlyweds in their first year. This is the core pre-marital track.",
    description:
      "Draft outline for the Engaged and First Year of Marriage track. The lesson list is public. Paid teaching is not on this page.",
    modules: [
      {
        title: "God's design for marriage",
        lessons: ["Covenant, not contract", "Roles and partnership", "Leaving and cleaving"],
      },
      {
        title: "Recipes for a blessed marriage",
        lessons: ["Daily habits", "Intimacy and romance", "Prayer together"],
      },
      {
        title: "Handling conflict and change",
        lessons: ["First-year adjustments", "Resolving conflict biblically", "In-laws and outside voices"],
      },
      {
        title: "Money, home, and future",
        lessons: ["Combining finances", "Building home culture and traditions", "Lessons from 19 years"],
      },
    ],
  },
];

export const COURSE_BUNDLE = {
  id: "couples-bundle",
  slot: "couplesBundle",
  title: "Couples bundle",
  note: "Committed Relationship and Engaged / First Year of Marriage, offered together when enrollment opens. The final bundle is still to be confirmed.",
};
