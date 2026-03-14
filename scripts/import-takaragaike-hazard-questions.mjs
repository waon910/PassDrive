import fs from "node:fs/promises";
import path from "node:path";

const DATASET_PATH = path.resolve(process.cwd(), "data/samples/mvp-sample-question-set.json");
const PUBLIC_IMAGE_DIR = path.resolve(process.cwd(), "public/question-images/takaragaike-hazard");
const SOURCE_REFERENCE_ID = "src_takaragaike_hazard_prediction";
const CATEGORY_ID = "cat_hazard_prediction";
const SOURCE_BASE_URL = "https://www.takaragaike.co.jp/se_q/";
const SELECTION_PAGE_URL = new URL("seqsen.html", SOURCE_BASE_URL).toString();

const HAZARD_ITEMS = [
  {
    id: "q_hazard_0001",
    sourceQuestionRef: "yosoku-01-01",
    imageFileName: "p07.jpg",
    stemJa: "３５km／hで進行しています。交差点を直進するときはどのようなことに注意して運転しますか？",
    stemEn: "You are driving at 35 km/h. What should you watch for when going straight through this intersection?",
    altEn: "Night intersection scene with a car turning left, a motorcycle ahead, and your vehicle going straight.",
    difficulty: "medium",
    prompts: [
      {
        key: "1",
        originalText:
          "二輪車が左折中の乗用車をさけて自分の車の前に進路を変更してくると危険なので、乗用車との車間距離をつめて進行する。",
        englishText:
          "Because the motorcycle may swing out around the left-turning car and move in front of you, close the gap to the car ahead and continue.",
        correctChoiceKey: "F"
      },
      {
        key: "2",
        originalText: "前の乗用車や二輪車が急に止まるかもしれないので、速度を落として進行する。",
        englishText: "The car ahead or the motorcycle may stop suddenly, so slow down and continue carefully.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText:
          "交差点の前方の状況が見えないので、前の乗用車や二輪車の動きに注意しながら乗用車の右側に出て速度を上げて進行する。",
        englishText:
          "Because the view ahead is blocked, move out to the right of the car ahead and speed up while watching the car and the motorcycle.",
        correctChoiceKey: "F"
      }
    ],
    explanationEn:
      "1) Do not close the gap. The motorcycle may brake sharply or move to the right of the turning car. Keep a safe following distance. 2) Slow down because the left-turning car may stop for pedestrians and the motorcycle may react suddenly. 3) Do not overtake on the right when your view is blocked. Wait, or even stop if needed, until you can confirm the situation ahead."
  },
  {
    id: "q_hazard_0002",
    sourceQuestionRef: "yosoku-01-02",
    imageFileName: "p14.jpg",
    stemJa: "交差点を左折するため１０km／hに減速しました。どのようなことに注意して運転しますか？",
    stemEn: "You have slowed to 10 km/h to turn left at the intersection. What should you watch for?",
    altEn: "Night intersection scene while turning left across a crosswalk with pedestrians and bicycles nearby.",
    difficulty: "medium",
    prompts: [
      {
        key: "1",
        originalText: "歩行者が横断歩道の横断を始めているので、横断を終えるまでその手前で待つ。",
        englishText: "A pedestrian has started to cross, so wait before the crosswalk until the crossing is complete.",
        correctChoiceKey: "T"
      },
      {
        key: "2",
        originalText:
          "夜間は視界が悪くなるため自転車などの発見がおくれがちになるので、よく注意をして左折する。",
        englishText:
          "At night, bicycles and other road users are harder to notice, so turn left only after checking very carefully.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText:
          "前照灯の照らす範囲のそとは見えにくいので、左側の横断歩道全体をよく確認しながら進行し、横断歩道の手前で止まる。",
        englishText:
          "Because areas outside your headlights are difficult to see, check the full crosswalk on the left and stop before it.",
        correctChoiceKey: "T"
      }
    ],
    explanationEn:
      "1) The pedestrian already has priority, so stop before the crosswalk and do not interfere. 2) Night driving makes late discovery of bicycles and pedestrians more likely, especially from the left rear when turning left. 3) Headlights do not cover the whole danger area, so keep checking the full crosswalk and stop before it while pedestrians are present."
  },
  {
    id: "q_hazard_0003",
    sourceQuestionRef: "yosoku-01-03",
    imageFileName: "p10.jpg",
    stemJa: "４０km／hで進行しています。前方の止まっている車のうしろからバスが近づいてくるときはどのようなことに注意して運転しますか？",
    stemEn: "You are driving at 40 km/h. A bus is approaching from behind a stopped vehicle ahead. What should you watch for?",
    altEn: "Two-way road with a stopped vehicle ahead and an oncoming bus partly hidden behind it.",
    difficulty: "hard",
    prompts: [
      {
        key: "1",
        originalText:
          "バスが中央線をはみ出してくるかもしれないので、はみ出してこないように中央線に寄って進行する。",
        englishText:
          "Because the bus might cross over the center line, move closer to the center line so it cannot come across.",
        correctChoiceKey: "F"
      },
      {
        key: "2",
        originalText:
          "バスは旅客の安全を考え無理な運転をせずに自分の車を先に通過させると思われるので、待たせないよう加速して通過する。",
        englishText:
          "The bus will probably avoid risky driving for its passengers and let you go first, so accelerate and pass quickly.",
        correctChoiceKey: "F"
      },
      {
        key: "3",
        originalText:
          "止まっている車のかげから歩行者が出てくるかもしれないので、車のかげのようすやバスの動きに気をつけながら減速して通過する。",
        englishText:
          "A pedestrian may step out from behind the stopped vehicle, so slow down while watching both the blind area and the bus.",
        correctChoiceKey: "T"
      }
    ],
    explanationEn:
      "1) Do not edge toward the center line. The oncoming bus may already need room to avoid the stopped vehicle, and moving right increases head-on risk. 2) Never assume the bus will yield. Self-centered assumptions cause crashes. 3) Slow down and be ready for a pedestrian or bicycle to emerge from the blind area, even if the bus passes first."
  },
  {
    id: "q_hazard_0004",
    sourceQuestionRef: "yosoku-02-01",
    imageFileName: "p08.jpg",
    stemJa: "４０km／hで進行しています。交差点を通過するときはどのようなことに注意して運転しますか？",
    stemEn: "You are driving at 40 km/h. What should you watch for when passing through this intersection?",
    altEn: "Intersection scene with an oncoming car waiting to turn right and another vehicle approaching from the left.",
    difficulty: "hard",
    prompts: [
      {
        key: "1",
        originalText:
          "対向車が止まらずに先に右折を始めたり、左側の車が止まらずに交差点に入ってくるかもしれないので、両方の車の動きに気をつけながら進行する。",
        englishText:
          "The oncoming car may begin turning right before you, and the car on the left may enter without stopping, so continue while watching both vehicles closely.",
        correctChoiceKey: "T"
      },
      {
        key: "2",
        originalText:
          "左側の車は対向車の右折の合図を見てそのまま交差点を通過しようとするかもしれないので、後続車にも注意しながらアクセルをゆるめて進行する。",
        englishText:
          "The car on the left may try to go through after seeing the oncoming car signal to turn right, so ease off the accelerator while also watching behind you.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText: "左側の車は優先道路を走っている自分の車を先に通過させると思われるので、やや加速して進行する。",
        englishText:
          "Because you are on the priority road, the car on the left will probably let you pass first, so continue with a little extra speed.",
        correctChoiceKey: "F"
      }
    ],
    explanationEn:
      "1) Even on a priority road, an oncoming vehicle may start turning right early and a vehicle on the left may fail to stop. Approach cautiously. 2) Another driver may misread the situation and enter, so ease off the accelerator and stay ready. 3) Do not rely on your priority. A safe driver is willing to yield rather than insist on being first."
  },
  {
    id: "q_hazard_0005",
    sourceQuestionRef: "yosoku-02-02",
    imageFileName: "p02.jpg",
    stemJa: "４０km／hで進行しています。どのようなことに注意して運転しますか？",
    stemEn: "You are driving at 40 km/h. What should you watch for in this situation?",
    altEn: "Road scene with children walking near the roadway and opposing traffic nearby.",
    difficulty: "medium",
    prompts: [
      {
        key: "1",
        originalText: "こどもが車道にとびだしてくるかもしれないので、ブレーキを数回に分けて踏んで、速度を落として進行する。",
        englishText:
          "A child may run into the roadway, so tap the brakes in stages and reduce speed as you continue.",
        correctChoiceKey: "T"
      },
      {
        key: "2",
        originalText: "こどもの横を通過するときに、対向車と行きちがうと危険なので、加速して、こどもの横を通過する。",
        englishText:
          "It would be dangerous to meet an oncoming car while passing the children, so accelerate and get past them quickly.",
        correctChoiceKey: "F"
      },
      {
        key: "3",
        originalText: "こどもがふざけて車道にとび出してくるかもしれないので、中央線を少しはみ出して通過する。",
        englishText:
          "A child may suddenly dart out while playing, so cross slightly over the center line and pass them.",
        correctChoiceKey: "F"
      }
    ],
    explanationEn:
      "1) Slow down early and use the brake lights to warn drivers behind you. Children can move unpredictably. 2) Do not accelerate past children. If they step out, you will have less time and space to react. 3) Do not escape into the oncoming lane. That can create a head-on collision. Reduce speed first and pass with caution."
  },
  {
    id: "q_hazard_0006",
    sourceQuestionRef: "yosoku-02-03",
    imageFileName: "p09.jpg",
    stemJa: "５０km／hで進行しています。どのようなことに注意して運転しますか？",
    stemEn: "You are driving at 50 km/h. What should you watch for here?",
    altEn: "Curve on a mountain road with limited visibility and possible oncoming traffic.",
    difficulty: "medium",
    prompts: [
      {
        key: "1",
        originalText:
          "この先ではカーブが急になってまがりきれず、ガードレールに衝突するおそれもあるので、速度を落として進行する。",
        englishText:
          "The curve may tighten ahead and you may not make it around safely, so reduce speed before entering.",
        correctChoiceKey: "T"
      },
      {
        key: "2",
        originalText:
          "対向車がくるようすがないので、このままの速度でカーブに入り、カーブの後半で一気に加速して進行する。",
        englishText:
          "There seems to be no oncoming traffic, so enter the curve at this speed and accelerate hard in the second half of the curve.",
        correctChoiceKey: "F"
      },
      {
        key: "3",
        originalText:
          "対向車が中央線をこえて進行してくるかもしれないので、速度を落として車線の左側へ寄って進行する。",
        englishText:
          "An oncoming vehicle may cross the center line, so slow down and keep well to the left within your lane.",
        correctChoiceKey: "T"
      }
    ],
    explanationEn:
      "1) Slow down enough before the curve. Centrifugal force can push the vehicle outward and cause a crash. 2) Never assume the road is clear just because you cannot see an oncoming car. Blind curves require caution, not acceleration. 3) Expect oncoming vehicles to drift over the center line and position yourself safely on the left."
  },
  {
    id: "q_hazard_0007",
    sourceQuestionRef: "yosoku-03-01",
    imageFileName: "p06.jpg",
    stemJa: "３０km／hで進行しています。直進するときはどのようなことに注意して運転しますか？",
    stemEn: "You are driving at 30 km/h. What should you watch for when going straight ahead?",
    altEn: "Blind urban intersection with a pedestrian ahead and limited left-right visibility.",
    difficulty: "medium",
    prompts: [
      {
        key: "1",
        originalText:
          "前方の歩行者は横断を終わろうとしているので、交差点ではできるだけ左側に寄ってその動きに注意しながらこのままの速度で進行する。",
        englishText:
          "The pedestrian ahead is almost done crossing, so keep as far left as possible and continue at the same speed while watching them.",
        correctChoiceKey: "F"
      },
      {
        key: "2",
        originalText: "交差点の見通しが悪いので、その手前でいつでも止まれるような速度に落とす。",
        englishText:
          "Because visibility at the intersection is poor, reduce speed before it so you can stop at any time.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText:
          "交差する道路から、歩行者が出てくるかもしれないので、カーブミラーや自分の目で、左右の安全を確かめて、通過する。",
        englishText:
          "A pedestrian may come from the cross street, so use the mirror and your own eyes to check both sides before passing through.",
        correctChoiceKey: "T"
      }
    ],
    explanationEn:
      "1) Do not keep your speed at a blind intersection. People or vehicles can appear suddenly. 2) Slow to a speed that lets you stop immediately if needed. 3) Intersections and nearby areas produce many crashes, so check both sides directly and pass only after confirming safety."
  },
  {
    id: "q_hazard_0008",
    sourceQuestionRef: "yosoku-03-02",
    imageFileName: "p01.jpg",
    stemJa: "４０km／hで進行しています。どのようなことに注意して運転しますか？",
    stemEn: "You are driving at 40 km/h. What should you watch for in this situation?",
    altEn: "Road scene with a stopped bus ahead that may hide pedestrians or oncoming traffic.",
    difficulty: "hard",
    prompts: [
      {
        key: "1",
        originalText:
          "こどもがバスのすぐ前を横断するかもしれないので、いつでも止まれるような速度に落としてバスの側方を進行する。",
        englishText:
          "A child may cross immediately in front of the bus, so pass beside the bus only after slowing to a speed that lets you stop at once.",
        correctChoiceKey: "T"
      },
      {
        key: "2",
        originalText:
          "対向車があるかどうかが、バスのかげでよくわからないので、前方の安全をよく確かめてから、中央線を越えて進行する。",
        englishText:
          "Because the bus hides whether an oncoming car is there, confirm the road ahead is safe before crossing the center line.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText: "後続の車があるので、速度を落とすには、追突されないようにブレーキを数回に分けて踏む。",
        englishText:
          "Because there is a car behind you, reduce speed by pressing the brake several times so the brake lights warn the driver behind.",
        correctChoiceKey: "T"
      }
    ],
    explanationEn:
      "1) A pedestrian, especially a child, may come out from in front of the bus, so slow to a stop-ready speed. 2) The bus also blocks your view of oncoming traffic, so make sure the opposing lane is clear before you move around it. 3) When slowing or stopping with a vehicle behind you, use staged braking so your brake lights warn the following driver."
  },
  {
    id: "q_hazard_0009",
    sourceQuestionRef: "yosoku-03-03",
    imageFileName: "p12.jpg",
    stemJa: "高速道路の加速車線を５０km／hで進行しています。どのようなことに注意して運転しますか？",
    stemEn: "You are driving at 50 km/h on an expressway acceleration lane. What should you watch for?",
    altEn: "Expressway merge scene with traffic on the main carriageway and a blind spot to the rear right.",
    difficulty: "hard",
    prompts: [
      {
        key: "1",
        originalText: "本線車道の後方からくる車との距離が十分にあると思われるので、すぐに本線車道に入る。",
        englishText:
          "It looks like there is enough space from the vehicle coming from behind on the main lane, so merge into the lane right away.",
        correctChoiceKey: "F"
      },
      {
        key: "2",
        originalText: "車のバックミラーの死角にほかの車がきているかもしれないので、右斜め後方をよく確かめる。",
        englishText:
          "Another vehicle may be in the blind spot of your mirrors, so check carefully over your right rear shoulder.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText: "本線車道の後方から車がきているが、追越車線はあいているので加速して一気に追越車線に入る。",
        englishText:
          "A car is approaching from behind on the main lane, but the passing lane looks open, so accelerate and merge directly into the passing lane.",
        correctChoiceKey: "F"
      }
    ],
    explanationEn:
      "1) Do not merge immediately. Use the acceleration lane to build speed and reduce the speed difference before merging. 2) Mirrors alone do not cover the blind spot, so check the rear-right area directly. 3) Entering the passing lane directly from the acceleration lane is extremely dangerous."
  },
  {
    id: "q_hazard_0010",
    sourceQuestionRef: "yosoku-04-01",
    imageFileName: "p05.jpg",
    stemJa: "交差点で右折待ちのため止まっています。どのようなことに注意して運転しますか？",
    stemEn: "You are stopped at an intersection waiting to turn right. What should you watch for?",
    altEn: "Intersection right-turn scene with an oncoming bus blocking the view of traffic behind it.",
    difficulty: "hard",
    prompts: [
      {
        key: "1",
        originalText:
          "バスは対向の乗用車に妨げられてすぐには進行してこないと思われるので、その前にすばやく右折する。",
        englishText:
          "The bus will probably be held up by the oncoming car, so turn right quickly before the bus comes through.",
        correctChoiceKey: "F"
      },
      {
        key: "2",
        originalText:
          "バスは自分の車が右折するのを待ってくれると思われ、また、後続車がいるので、すばやく右折する。",
        englishText:
          "The bus will probably wait for you to turn right, and there is a vehicle behind you, so turn quickly.",
        correctChoiceKey: "F"
      },
      {
        key: "3",
        originalText: "バスのうしろの状況がわからないので、バスが通過したあとでようすをよく確かめてから右折する。",
        englishText:
          "Because you cannot see what is behind the bus, wait until it passes and then confirm the situation carefully before turning right.",
        correctChoiceKey: "T"
      }
    ],
    explanationEn:
      "1) Do not guess that the bus will be blocked and stay out of your way. It may still come straight through. 2) Do not rush because of the vehicle behind you or because you expect the bus to wait. 3) After the bus passes, check carefully for hidden vehicles or motorcycles behind it before you turn right."
  },
  {
    id: "q_hazard_0011",
    sourceQuestionRef: "yosoku-04-02",
    imageFileName: "p04.jpg",
    stemJa: "交差点の中をトラックに続いて５km／hで進行しています。右折するときはどのようなことに注意して運転をしますか？",
    stemEn: "You are moving at 5 km/h inside the intersection behind a truck. What should you watch for when turning right?",
    altEn: "Intersection scene following a large truck that blocks your forward view while turning right.",
    difficulty: "hard",
    prompts: [
      {
        key: "1",
        originalText: "トラックのかげで前方が見えないので、トラックの右側方に並んで右折する。",
        englishText:
          "Because the truck blocks your view ahead, move up beside the truck on its right and turn right next to it.",
        correctChoiceKey: "F"
      },
      {
        key: "2",
        originalText:
          "トラックのかげで前方が見えないので、一時停止してトラックが右折したあと対向車がこないことや歩行者の動きを確かめて右折する。",
        englishText:
          "Because the truck blocks your view ahead, stop, let the truck finish turning, then check for oncoming vehicles and pedestrians before turning right.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText: "トラックのかげで前方が見えないので、トラックに続いてそのすぐうしろを右折する。",
        englishText:
          "Because the truck blocks your view ahead, follow it closely and turn right immediately behind it.",
        correctChoiceKey: "F"
      }
    ],
    explanationEn:
      "1) Do not turn beside the truck. Large vehicles create blind spots and may move outward. 2) Let the truck clear the intersection, then confirm oncoming traffic and pedestrian movement before you turn. 3) Turning immediately behind the truck is also dangerous because you still cannot see pedestrians or bicycles clearly."
  },
  {
    id: "q_hazard_0012",
    sourceQuestionRef: "yosoku-04-03",
    imageFileName: "p11.jpg",
    stemJa: "前の車に続いて止まりました。踏切を通過するときはどのようなことに注意して運転をしますか？",
    stemEn: "You stopped behind the vehicle ahead. What should you watch for when crossing this railroad crossing?",
    altEn: "Railroad crossing scene with traffic congestion beyond the tracks and oncoming vehicles nearby.",
    difficulty: "hard",
    prompts: [
      {
        key: "1",
        originalText:
          "前方のようすがわからず、踏切内で止まってしまうおそれがあるので、踏切の先に自分の車が止まれる余地のあることを確認してから踏切に入る。",
        englishText:
          "Because you may have to stop on the tracks if traffic ahead stalls, enter the crossing only after confirming there is space for your car beyond it.",
        correctChoiceKey: "T"
      },
      {
        key: "2",
        originalText: "対向車がきているが、左側に寄りすぎないように通過する。",
        englishText:
          "An oncoming vehicle is approaching, but cross without keeping too far left.",
        correctChoiceKey: "T"
      },
      {
        key: "3",
        originalText:
          "対向車線の乗用車のうしろのトラックと踏切内ですれちがうのに十分な道幅がないかもしれないので、前の車に続いてはやめに踏切に入る。",
        englishText:
          "There may not be enough width to pass the truck behind the oncoming car inside the crossing, so follow the car ahead and enter the crossing early.",
        correctChoiceKey: "F"
      }
    ],
    explanationEn:
      "1) Never enter a railroad crossing unless you know there is space for your vehicle beyond it. Getting trapped on the tracks is extremely dangerous. 2) Do not drive too far left on a crossing because you may drop a wheel off the edge. Watch the oncoming vehicle and stay slightly toward the center. 3) Entering early just to squeeze through is dangerous. Wait until the space beyond the crossing is clearly available."
  }
];

function upsertById(records, nextRecord) {
  const index = records.findIndex((record) => record.id === nextRecord.id);

  if (index >= 0) {
    records[index] = nextRecord;
    return;
  }

  records.push(nextRecord);
}

async function ensureImageDownloaded(imageFileName) {
  await fs.mkdir(PUBLIC_IMAGE_DIR, { recursive: true });
  const sourceUrl = new URL(`e_mondai/${imageFileName}`, SOURCE_BASE_URL).toString();
  const outputPath = path.join(PUBLIC_IMAGE_DIR, imageFileName);

  try {
    await fs.access(outputPath);
  } catch {
    const response = await fetch(sourceUrl, {
      headers: {
        "user-agent": "PassDrive importer/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download ${sourceUrl}: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  }

  return `/question-images/takaragaike-hazard/${imageFileName}`;
}

async function main() {
  const raw = await fs.readFile(DATASET_PATH, "utf8");
  const dataset = JSON.parse(raw);
  const now = new Date().toISOString();
  const activeContentVersionId = dataset.contentVersions.find((version) => version.status === "active")?.id;

  if (!activeContentVersionId) {
    throw new Error("Could not find an active content version.");
  }

  dataset.questionPrompts = Array.isArray(dataset.questionPrompts) ? dataset.questionPrompts : [];

  upsertById(dataset.categories, {
    id: CATEGORY_ID,
    slug: "hazard-prediction",
    labelEn: "Hazard Prediction",
    descriptionEn: "Illustration-based hazard prediction items used in the final written test.",
    displayOrder: 9,
    isActive: true
  });

  upsertById(dataset.sourceReferences, {
    id: SOURCE_REFERENCE_ID,
    sourceName: "Takaragaike Driving School Hazard Prediction Practice",
    sourceType: "other",
    sourceUrl: SELECTION_PAGE_URL,
    publisher: "Kyoto Takaragaike Driving School",
    regionScope: "national",
    originalLanguage: "ja",
    fetchedAt: now,
    snapshotPath: "snapshots/takaragaike-hazard-prediction.html",
    rightsNotes:
      'The source page states "anyone may use these practice questions freely," but separate redistribution rights were not independently verified.',
    createdAt: now,
    updatedAt: now
  });

  dataset.questions = dataset.questions.filter((question) => !String(question.id).startsWith("q_hazard_"));
  dataset.questionPrompts = dataset.questionPrompts.filter((prompt) => !String(prompt.questionId).startsWith("q_hazard_"));
  dataset.explanations = dataset.explanations.filter((explanation) => !String(explanation.questionId).startsWith("q_hazard_"));
  dataset.questionTags = dataset.questionTags.filter((mapping) => !String(mapping.questionId).startsWith("q_hazard_"));

  for (const [index, item] of HAZARD_ITEMS.entries()) {
    const imageAssetPath = await ensureImageDownloaded(item.imageFileName);
    const explanationId = `exp_hazard_${String(index + 1).padStart(4, "0")}_v1`;

    dataset.questions.push({
      id: item.id,
      sourceReferenceId: SOURCE_REFERENCE_ID,
      contentVersionId: activeContentVersionId,
      sourceQuestionRef: item.sourceQuestionRef,
      questionType: "hazard_prediction",
      mainCategoryId: CATEGORY_ID,
      difficulty: item.difficulty,
      status: "published",
      originalStem: item.stemJa,
      originalLanguage: "ja",
      englishStem: item.stemEn,
      pointValue: 2,
      hasImage: true,
      imageAssetPath,
      imageAltTextEn: item.altEn,
      explanationOrigin: "source",
      activeExplanationId: explanationId,
      isExamEligible: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now
    });

    for (const [promptIndex, prompt] of item.prompts.entries()) {
      dataset.questionPrompts.push({
        id: `qp_hazard_${String(index + 1).padStart(4, "0")}_${prompt.key}`,
        questionId: item.id,
        promptKey: prompt.key,
        displayOrder: promptIndex + 1,
        originalText: prompt.originalText,
        englishText: prompt.englishText,
        correctChoiceKey: prompt.correctChoiceKey
      });
    }

    dataset.explanations.push({
      id: explanationId,
      questionId: item.id,
      origin: "source",
      bodyEn: item.explanationEn,
      sourceDerived: true,
      createdBy: "import-takaragaike-hazard-questions",
      createdAt: now,
      updatedAt: now
    });
  }

  dataset.meta.generatedAt = now;
  if (typeof dataset.meta.notes === "string" && !dataset.meta.notes.includes("Takaragaike hazard prediction")) {
    dataset.meta.notes = `${dataset.meta.notes} Added Takaragaike hazard prediction practice items.`;
  }

  await fs.writeFile(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
