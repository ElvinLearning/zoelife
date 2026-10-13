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

/**
 * Batch 2 clips. Ids are prefixed so they do not collide with batch 1
 * `clip-01-title` … `clip-08-title` on the Resources page.
 * Clip 08 is Faith / Prayer (index site category), not also listed under Singles.
 */
export const BATCH2_CLIPS = [
  {
    id: "r01",
    file: "01_dating_period_3yrs",
    title: "What's a Reasonable Dating Period?",
    youtube: "https://www.youtube.com/watch?v=PuczNwXtv6c&t=2s",
  },
  {
    id: "r02",
    file: "02_dont_raise_hopes",
    title: "Don't Raise Hopes You Won't Meet",
    youtube: "https://www.youtube.com/watch?v=PuczNwXtv6c&t=414s",
  },
  {
    id: "r03",
    file: "03_ask_for_clarity",
    title: "If They're Not Clear, Ask",
    youtube: "https://www.youtube.com/watch?v=PuczNwXtv6c&t=487s",
  },
  {
    id: "r04",
    file: "04_purpose_is_marriage",
    title: "Dating Should Head Toward Marriage",
    youtube: "https://www.youtube.com/watch?v=PuczNwXtv6c&t=869s",
  },
  {
    id: "r05",
    file: "05_dont_waste_my_time",
    title: "Don't Let Someone Waste Your Time",
    youtube: "https://www.youtube.com/watch?v=PuczNwXtv6c&t=1300s",
  },
  {
    id: "r06",
    file: "06_just_because_god_said",
    title: "Just Because God Said So…",
    youtube: "https://www.youtube.com/watch?v=5JeV1rwc0KU&t=670s",
  },
  {
    id: "r07",
    file: "07_take_a_step",
    title: "If It's God, There'll Be Confirmation",
    youtube: "https://www.youtube.com/watch?v=5JeV1rwc0KU&t=741s",
  },
  {
    id: "r08",
    file: "08_test_all_things",
    title: "Test All Things",
    youtube: "https://www.youtube.com/watch?v=5JeV1rwc0KU&t=838s",
  },
  {
    id: "r09",
    file: "09_thats_your_husband",
    title: "\"That's Your Husband\"",
    youtube: "https://www.youtube.com/watch?v=5JeV1rwc0KU&t=902s",
  },
  {
    id: "r10",
    file: "10_disagreements_normal",
    title: "Disagreements in Marriage Are Normal",
    youtube: "https://www.youtube.com/watch?v=3oeg3VNvr1s&t=123s",
  },
  {
    id: "r11",
    file: "11_truth_bad_way",
    title: "You Can Tell the Truth in a Bad Way",
    youtube: "https://www.youtube.com/watch?v=3oeg3VNvr1s&t=225s",
  },
  {
    id: "r12",
    file: "12_apples_of_gold",
    title: "Speak Truth Like Apples of Gold",
    youtube: "https://www.youtube.com/watch?v=3oeg3VNvr1s&t=325s",
  },
  {
    id: "r13",
    file: "13_uncommunicated_expectations",
    title: "Uncommunicated Expectations",
    youtube: "https://www.youtube.com/watch?v=bly45MydPKE&t=91s",
  },
  {
    id: "r14",
    file: "14_understand_the_why",
    title: "There's a Why Behind the Conflict",
    youtube: "https://www.youtube.com/watch?v=bly45MydPKE&t=227s",
  },
  {
    id: "r15",
    file: "15_marriage_designed_by_god",
    title: "Marriage Was Designed by God",
    youtube: "https://www.youtube.com/watch?v=NfCYH4YSKPU&t=150s",
  },
  {
    id: "r16",
    file: "16_deal_while_single",
    title: "Deal With It While You're Single",
    youtube: "https://www.youtube.com/watch?v=ryvGSZ2U7ng&t=130s",
  },
];

export const ALL_CLIPS = [...CLIPS, ...BATCH2_CLIPS];

const captionsNote = "Captions are already in the picture. Press play when you are ready.";

export const RESOURCE_CATEGORIES = [
  {
    id: "singles-dating",
    title: "Singles & Dating",
    intro:
      "Roadmap from Single to Married, Recognizing the Right One, and Dangerous Lies Singles Believe.",
    blocks: [
      { type: "playlist", id: "PLTiUnmAGHZkM" },
      {
        type: "clips",
        ids: ["r01", "r02", "r03", "r04", "r05", "r06", "r07", "r09", "r16"],
        heading: "h4",
        intro: `Nine short clips from Roadmap from Single to Married. ${captionsNote}`,
      },
      { type: "playlist", id: "PL2QfJI8adA_YfcMZByFKFitwv59m6iDnP" },
      { type: "playlist", id: DANGEROUS_LIES_PLAYLIST_ID, shorts: true },
    ],
  },
  {
    id: "marriage",
    title: "Marriage",
    band: "band-tan",
    intro: "Marriage 101 and Recipes for a Blessed Marriage, plus a short clip from Marriage 101.",
    blocks: [
      { type: "playlist", id: "PL2QfJI8adA_YXHB-JjLXv7qyP2pbetI0Z" },
      { type: "playlist", id: "PL2QfJI8adA_Zlr6yymbp_MkVfb0tO9cze" },
      {
        type: "clips",
        ids: ["r15"],
        heading: "h4",
        intro: captionsNote,
      },
    ],
  },
  {
    id: "conflict",
    title: "Conflict",
    intro: "Conflict Resolution, and short clips on why disagreements start and how to speak with grace.",
    blocks: [
      { type: "playlist", id: "PL2QfJI8adA_b13X9wl5zwxWDyeO5pCkK2" },
      {
        type: "clips",
        ids: ["r10", "r11", "r12", "r13", "r14"],
        heading: "h4",
        intro: captionsNote,
      },
    ],
  },
  {
    id: "faith-prayer",
    title: "Faith / Prayer",
    intro: "Test what you hear, and hold fast to what is good.",
    blocks: [
      {
        type: "clips",
        ids: ["r08"],
        heading: "h3",
        intro: captionsNote,
      },
    ],
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
