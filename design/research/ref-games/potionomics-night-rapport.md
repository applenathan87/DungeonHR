# Potionomics — 시간 구조·관계(rapport)·상점·이벤트 조사 (밤 파트 설계 근거)

> 조사일: 2026-09-12 · 목적: 「마왕성 인사팀」 **밤 파트**(퇴근 후 개인 시간: 상점·바·인물 이벤트·서브스토리 → 카드·정보·자원) 설계 근거.
> 흥정 카드 배틀(게이지·인내·덱 규칙·스트레스 나선·파훼 덱)은 **기존 문서 [ref-games/potionomics.md](potionomics.md)** 에 있으므로 반복하지 않고 "기존 문서 §N 참조"로만 표기.
> 표기 규칙: **[사실]** = 출처로 확인된 것 / **[해석]** = 우리 설계를 위한 판단. 단일 출처만 있는 사실은 ⚠️. 확인 못 한 것은 **미확인**.
> 접근 제한: TechRaptor(봇 차단), The Guardian(본문 접근 불가 — 검색 스니펫과 Wikipedia 인용만), Eurogamer·Kotaku(리뷰 존재 자체 **미확인**). Reddit 미사용.

---

## 1. 시간 구조

**[사실]**
- 총 **50일 = 10일 × 5주**. 각 주 마지막 날(10·20·30·40·50일)이 대회. 대회일은 흥정 외 아무 행동도 못 하므로 실질 **45일 × 6슬롯 = 270슬롯**이 한 회차 예산(유저 계산; "실효 240 정도" 반론 있음).
- 하루 **6슬롯 = 낮 2 · 오후 2 · 밤 2**. "낮 파트/밤 파트" 구분은 **없다** — 하나의 슬롯 예산을 가게·양조·이동·관계가 나눠 먹는다. (CGMagazine만 "8칸"으로 기재 — 다수 출처가 6이라 오기로 판단.)
- 슬롯 비용: 가게 오픈 **2** · 마을 왕복 이동 **1**(하루 한 번 나가면 NPC 간 이동은 무료 — 가이드가 "두 번 나가지 말라"고 경고) · **랭크업 1** · 행아웃 **1에서 4** · 선물·구매·서비스 **0** · 조기 취침 = 남은 슬롯당 스트레스 −10. 양조는 슬롯이 흐르면 진행. 모험가 파견의 시간 비용은 출처가 엇갈려 **미확인**.
- ⚠️ 밤 2슬롯은 양조·정원·원정 대기 시간에 누적되지만 행동엔 못 쓴다(스팀 270 스레드 단독).
- 튜토리얼은 **Day 3에 종료**. 캐릭터는 Day 1·2·3·7·12·13·13·14·22에 **3주에 걸쳐 순차 등장**. 개발자: "게임 세 개를 동시에 가르치는 느낌이라 하루에 개념 하나씩 소개하도록 반복했다"(Darmawan).
- **일일 이벤트 달력**이 고정돼 있다: Day 5 수확제(기본 포션↑), Day 7 Roxanne의 마나 포션 덤핑(↓), Day 16 Corsac의 영향(고객 Stubborn −25%), Day 27 Finn의 치료제 판매 금지, Day 38 Anubia의 지역 봉쇄 등. 무작위 지역 이벤트·Luna 마케팅(다음날 적용)·길드 남획 페널티가 겹치고, 하루 끝 화면에 다음 대회 요구 포션이 표시된다.
- 압박 장치는 빚(서사)이 아니라 **대회**: 특정 포션 2에서 3종을 최소 품질 이상으로 제출 → 3판 2선승 → **패배 = 게임오버**(기존 문서 §루프 통합 참조).

**[해석]**
- 포셔노믹스에는 "밤"이 없다. 관계·상점은 **낮의 슬롯을 먹는 경쟁자**이고 대회 마감이 그 경쟁을 매일 강제한다 — "관계는 사치"라는 체감(§6 불만의 뿌리). 우리 밤 파트(행동 제한 없음, v0.2)는 정반대편에 있다.
- 배울 것: ① **고정 달력 이벤트** = 우리 석간 신문의 "다음날 복선" 역할. ② **인물 순차 등장** = 우리 직급별 언락(night-part §5)과 동형.

출처: [스팀 토론 270슬롯](https://steamcommunity.com/app/1874490/discussions/0/3493130356503509836/) · [Nintendo Smash 시간 구조](https://nintendosmash.com/potionomics-how-time-segments-work/) · [Wikipedia](https://en.wikipedia.org/wiki/Potionomics) · [Fandom Gamemodes](https://potionomics.fandom.com/wiki/Gamemodes) · [Fandom Daily Events](https://potionomics.fandom.com/wiki/Daily_Events) · [스팀 가이드 35+ tips](https://steamcommunity.com/sharedfiles/filedetails/?id=2882431237) · [스팀 가이드 Incomplete Guide(주간 달력)](https://steamcommunity.com/sharedfiles/filedetails/?id=2934132288) · [mejoress 선물 가이드(등장일)](https://www.mejoress.com/potionomics-characters-best-gift-guide/) · [PC Gamer — 개발자 튜토리얼 발언](https://www.pcgamer.com/i-wish-every-shop-sim-made-ruthless-capitalism-this-relaxing/) · [TheGamer 12 things](https://www.thegamer.com/potionomics-beginner-tips-tricks/)

---

## 2. 관계(rapport) 시스템

**[사실]**
- 관계 대상 **10명** + Owl(랭크 5 상한, 카드는 대회 보상) + Boss Finn(Masterwork DLC: 관계·로맨스·유료 "라이프 코치"). 역할: Quinn(재료 상인), Mint·Xidriel·Corsac(모험가), Baptiste(길드장·원정 투자), Muktuk(가마솥·선반), Saffron(가게 확장·연료·꾸미기), Roxanne(라이벌 → 인챈트 상점), Luna(마케팅), Salt & Pepper(해적, 보물상자).
- **랭크 10단계**. 화면에 보이는 랭크(하트)와 **숨은 호감치(friendship)의 이중 구조**: 선물·행아웃·대화·커스텀 주문으로 호감치를 쌓고, NPC를 찾아가 "Rank Up"을 실행(슬롯 1)해야 랭크가 오른다. 호감치는 랭크업 가능 상태에서도 계속 쌓이므로 "나중에 몰아서 여러 번 랭크업"이 가능.
- **랭크업 장면** = 스토리 컷신 + 대화 선택지 2에서 3곳. 선택지는 ♦♦(최선)/♦(차선)/♥(로맨스 플래그)/중립("Tell me more")로 등급화되고, 얻은 "sympathy"는 **다음 랭크 진행치로 이월**된다. 실패·분기 없음(친구/연인 대사 분기만). ⚠️ 오답 시 호감 감소는 Sirus Gaming 단독 기재.
- **행아웃** = "Hang Out" 선택 → 짧은 장면(수다 또는 개그 한 컷) → 호감 + 스트레스 감소. 4티어 = 기본(1슬롯)·랭크 3(2)·랭크 5(3)·랭크 7(4). ⚠️ 스트레스 감소 5/15/30/50%(35+ tips 단독). 장면 안 선택지 유무는 **미확인**.
- **선물** = 시간 0. 캐릭터별 선호 재료 유형이 있고 비선호는 보너스 없음(감점 없음). 희귀도 4단계가 높을수록 호감 큼. **Pure Mana는 전원 최애**라 슬라임 정원으로 복제해 뿌리는 "선물 경제"가 최적해. 1일 선물 제한 **미확인**.
- **로맨스**: 랭크 7 고백. 원작은 **1명 한정**(나머지는 "Best Friend"), Masterwork에서 Free Love 추가. 랭크 8에서 10 장면은 동일 골격 + 대사 차이. 게임플레이 효과 없음.
- **랭크 10 게이트** = 지정 포션 2종을 **Superior 등급 이상**으로 커스텀 주문 납품(예: Quinn = Mana Potion + Sight Enhancer). 즉 관계 만렙은 생산 숙련을 요구.
- 시간 비용 실측: 가이드 3종이 입을 모아 "**행아웃은 함정(trap/scam)**" — 행아웃만으로 전원 만렙은 "150일 이상", Pure Mana 12에서 14회면 만렙. 랭크업만 해도 100슬롯(270의 37%).

**[해석]**
- 구조 자체는 좋다: **"호감 = 은행 잔고, 랭크업 = 인출"**이라 보상 순간을 플레이어가 고르고, 랭크업 장면이 카드·쿠폰의 "봉투"가 된다. 문제는 인출에 슬롯이 들어 관계가 낮과 경쟁한 것 — Masterwork Cozy가 정확히 이 비용(이동·랭크업)만 0으로 만든 것이 개발사의 자백이다.
- **행아웃 사장(死藏)이 가장 중요한 교훈**: 행아웃에 보상 둘(호감·스트레스)을 걸었지만 각각 더 싼 대체재(선물 = 시간 0, 조기 취침 = 슬롯당 −10)에 지배당해 콘텐츠가 통째로 버려졌다. 우리 밤 파트의 활동마다 **대체 불가능한 유일 보상**이 있어야 한다.

출처: [Fandom Dating](https://potionomics.fandom.com/wiki/Dating) · [Fandom Quinn](https://potionomics.fandom.com/wiki/Quinn) · [Fandom Roxanne](https://potionomics.fandom.com/wiki/Roxanne) · [Neoseeker 관계](https://www.neoseeker.com/potionomics/Boosting_Relationships) · [Sirus 선물·랭크](https://sirusgaming.com/potionomics-gifts-and-increasing-friendships/) · [Sirus Muktuk 가이드](https://sirusgaming.com/potionomics-muktuk-character-guide/) · [SteamAH 대화 선택지 전체](https://steamah.com/potionomics-all-dialogue-answers-guide/) · [스팀 가이드 Cards & Coupons + Lv10](https://steamcommunity.com/sharedfiles/filedetails/?id=2878565533) · [스팀 토론 로맨스](https://steamcommunity.com/app/1874490/discussions/0/3493130356498677598/) · [35+ tips](https://steamcommunity.com/sharedfiles/filedetails/?id=2882431237) · [Gamer Journalist 카드·쿠폰](https://gamerjournalist.com/all-characters-cards-and-coupons-in-potionomics/)

---

## 3. 관계 → 카드 구조의 정확한 규칙

**[사실]**
- 카드 지급 랭크(1·2·3·5·6·7·9·10 = 8종), 20장 고정 덱, 업그레이드·구매 없음, Owl 예외 → **기존 문서 §덱빌딩 층 참조**. 희귀도 개념 없음. 카드 순서는 캐릭터별 고정 커리큘럼.
- 새로 확인한 **랭크 4·8 쿠폰 표**(해당 캐릭터 서비스에만 적용, 양도 불가): Quinn 재료 10→20% · Muktuk 제작·업그레이드 15→25% · Saffron 가게 업그레이드·연료 10→20% · Luna 마케팅 20→40% · Roxanne 인챈트 20→40% · Salt & Pepper 보물상자 20→40% · Baptiste 길드 재료 10→20% · Mint·Xid·Corsac 모험 25→50%. Owl은 쿠폰 없음.
- 캐릭터별 아키타입: Quinn 관심 지속딜, Muktuk 한 방 버프, Mint 쉴드, Saffron 스트레스 케어, Baptiste 인내 생성·타협, Roxanne 매혹·결점 은폐, Xid 코스트·드로우 엔진, Luna 스트레스 도박, Salt & Pepper 양자택일, Corsac 스탠스. 개발자: "각 카드는 그 인물의 협상 스타일, 덱 전체는 인생관 — 친구 버릇이 옮는 경험."
- "특정 인물과 친해야 특정 전략" 실작동 사례: Day 16 이벤트(고객 Stubborn −25%)의 해법이 **Luna 랭크 1** Elevator Pitch(Sympathy +25%) / 최종 보스 해법이 **Mint 랭크 10** Fortitude(스트레스 무효)·Baptiste Compromise·Strategic Withdrawal / 후반은 **Xid** Chorus·Rhythm이 만능(정답기 — 기존 문서 §시너지 참조). 커뮤니티 정석: "Roxanne·Xid·Saffron 카드가 최고이니 먼저 사귀어라."
- 설계 유래: 원안은 Slay the Spire식 "흥정 후 카드 보상"이었으나 **"실비아에게 레벨업이 없으니 덱빌딩이 진행 시스템"** → Persona 소셜링크처럼 관계 랭크에 카드를 묶음. 루프 "흥정 → 돈 → 시간과 선물 → 카드"가 "게임의 정의적 특징"이 됐다(Darmawan).

**[해석]**
- 카드 공급을 관계에 **독점**시킨 것이 정체성이자 문제: 관계를 안 하면 덱이 안 자라니 관계가 **강제**되고, 누구를 사귈지가 **메타 최적화**로 환원된다("Roxanne 먼저"). 우리는 까마귀 상점 매매(interview_idea v0.2)와 병행하므로 독점이 아니다 — **관계 전용 카드는 상점에 없는 "채널 조작" 효과**만 소수 정예로 두면 호평 부분만 가져올 수 있다.

출처: [Game Developer 인터뷰(관계 유래)](https://www.gamedeveloper.com/business/how-potionomics-turned-price-haggling-into-a-card-game) · [Game Rant 인터뷰](https://gamerant.com/potionomics-interview-romance-humor-personality/) · [Gamer Journalist 카드·쿠폰](https://gamerjournalist.com/all-characters-cards-and-coupons-in-potionomics/) · [Fandom Corsac](https://potionomics.fandom.com/wiki/Corsac) · [Fandom Luna](https://potionomics.fandom.com/wiki/Luna) · [스팀 가이드 Cards & Coupons](https://steamcommunity.com/sharedfiles/filedetails/?id=2878565533) · [TheGamer 캐릭터 랭킹(카드 아키타입)](https://www.thegamer.com/potionomics-side-characters-ranked/) · [Incomplete Guide(Day 16 대응)](https://steamcommunity.com/sharedfiles/filedetails/?id=2934132288)

---

## 4. 상점·허브·서비스

**[사실]**
- 마을 = 지도에서 NPC 아이콘 선택(장소 이동 연출 없음). 서비스 → 낮 되먹임:
  - **Quinn** 재료 일일 재고(희귀도별 10/4/2/1개). 새 재료를 기부하면 다음날부터 **영구 판매 목록에 추가**("Expand") — 원정으로 발견한 재료를 안정 공급원으로 바꾸는 장치.
  - **Muktuk** 가마솥(대회 승리마다 상위 모델 해금)·선반·업그레이드. **Saffron** 가게 확장(가마솥 자리·지하실)·연료·인테리어 "glamours"(스팀 페이지: 꾸미기가 가격·품질 등에 이득).
  - **Baptiste** 길드 원정 투자(돈 내고 재료 대량 확보, 남획하면 지역 페널티 이벤트) + 퀘스트. **Mint·Xid·Corsac** 원정 파견(골드 + 포션 지급, 지역별 드랍, 레벨업).
  - **Roxanne** 당일 인챈트(포션 전체에 긍정 트레잇, 80에서 2,700G). **Luna** 다음날 마케팅(특정 포션 기본가 +10에서 +40%). **Salt & Pepper** 보물상자(랜덤 재료, "scam" 평). **Corsac** 슬라임 정원(재료 복제). Day 14 자판기, Day 25 숙성통.
- **바·휴식 공간은 없다**(Fandom 로케이션 = Town·Potion Shop·Heroes Guild·Adventure뿐). 휴식 = 조기 취침과 행아웃 장면. 행아웃 배경 장소 목록은 **미확인**.
- 후반 경제: Day 30 이후 하루 1만에서 4만 골드가 들어오는데 쓸 곳이 없다(스팀). Roxanne 인챈트 "골드 값어치 못 함", Salt & Pepper "순수 골드 싱크".

**[해석]**
- 모든 서비스가 "내일의 생산성"으로 되먹임된다는 원칙은 night-part §7 표와 같다. 차이는 **서비스가 인물과 1:1로 묶여** 쿠폰이 관계의 경제적 이유가 된다는 점 — 까마귀 상점(단일 NPC)에는 이 축이 없다. 인물별 서비스로 쪼갤지가 결정 포인트.
- 후반 싱크 고갈은 §6 "방 꾸미기 = 장기 싱크"가 맞는 방향임을 뒷받침한다. 쿠폰형 할인은 골드 가치를 더 떨어뜨려 후반에 독이 될 수 있다.

출처: [Fandom Roxanne(인챈트 표)](https://potionomics.fandom.com/wiki/Roxanne) · [Fandom Daily Events(Luna 캠페인 표·길드 이벤트)](https://potionomics.fandom.com/wiki/Daily_Events) · [Fandom 메인(로케이션)](https://potionomics.fandom.com/wiki/Potionomics_Wiki) · [Sirus 전체 캐릭터](https://sirusgaming.com/potionomics-all-characters/) · [Bonus Action 워크스루](https://bonus-action.com/guides/potionomics-walkthrough-all-potion-competitions-tips-and-faq/) · [Steam 상점 페이지](https://store.steampowered.com/app/1874490/Potionomics/) · [스팀 토론 "Just beat the game"](https://steamcommunity.com/app/1874490/discussions/0/3493130356502125477/) · [35+ tips](https://steamcommunity.com/sharedfiles/filedetails/?id=2882431237)

---

## 5. 이벤트·서브스토리

**[사실]**
- 트리거 3종: ① **고정일 메인 스토리**(인물 등장·튜토리얼·대회) ② **랭크업**(호감치 충족 + 방문 + 슬롯 1) ③ **조건 게이트**(Xid = Day 13 + Greater Mana Potion 납품 / 랭크 10 = Superior 포션 2종 / Roxanne = 1차 대회 패배 며칠 뒤 지하실 입주 / Baptiste = 첫 원정 후).
- 기계적 보상: 랭크업 장면 자체가 카드·쿠폰 지급 순간. 스토리 진행이 서비스를 열기도 한다(Roxanne 입주 → 인챈트 상점). 퀘스트도 호감 보상(10/19 패치가 Baptiste 퀘스트의 "과도한 관계 포인트" 수정).
- 분기·실패: **없음**. 선택지는 호감 가감과 로맨스 플래그(♥)뿐이고, 원작 1인 로맨스 락 외에는 결과가 갈리지 않는다. Endless 모드 전용 관계 장면 추가(Masterwork). ⚠️ 커스텀 주문 미납 페널티 없음(가이드 단독).
- **라이벌의 일일 이벤트**가 낮 규칙을 바꾼다: Roxanne 마나 포션 덤핑, Corsac 고객 완고, Finn 치료제 판매 금지, Anubia 지역 봉쇄 — 서사 인물이 경제 규칙에 개입하는 유일한 결합 지점.

**[해석]**
- 포셔노믹스의 서브스토리는 **"보상 봉투"**지 판단·분기 장치가 아니다. 우리 뇌물 서브스토리(도덕 축) 같은 것의 선례는 여기에 없다 — 그 계보는 Papers, Please(EZIC)다. 다만 "이벤트가 **다음날 규칙**을 바꾼다"는 기계 결합(라이벌 이벤트)은 우리 "당일 지침" 후크와 바로 결합된다: 밤의 사건 → 다음 날의 당일 지침.

출처: [Fandom Daily Events](https://potionomics.fandom.com/wiki/Daily_Events) · [TV Tropes 캐릭터(스토리 아크)](https://tvtropes.org/pmwiki/pmwiki.php/Characters/Potionomics) · [Fandom Dating](https://potionomics.fandom.com/wiki/Dating) · [스팀 공지 Patch 10/19/22](https://steamcommunity.com/games/1874490/announcements/detail/3396302964501602391) · [SteamAH 대화 가이드](https://steamah.com/potionomics-all-dialogue-answers-guide/) · [Incomplete Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2934132288)

---

## 6. 평가 — 호평·비판·개발사의 수정

**[사실] 호평**
- PC Gamer 87: 관계가 "**Persona 게임 같다** — 시간 블록을 유대에 배분해 결국 카드를 얻는다", 전체가 "extremely cohesive". RPS: 카드 게임이 최고, "카드가 실비아의 착하고 엉뚱한 태도를 반영해 게임 전체와 결이 맞는다". RPGFan 74: "관계로 덱을 짜는 건 **언제나 설렜다**". Inverse 8/10: 관계가 "**훨씬 유기적**이고 NPC 호감을 사는 느낌이 덜하다". 튜토리얼 페이싱 호평("하루에 개념 하나").

**[사실] 비판**
- **시간 압박**: RPS "시간은 유한 자원이고 모든 행동이 깎는다… 한마디로 스트레스, 살짝 너무 어렵다". Guardian 3/5 "**불필요하게 징벌적인 구조**가 모든 재미를 빼간다"(대회 실패 = 게임오버 → 리로드 강제). Tech-Gaming 80 "**가게나 꾸미고 싶었지 10일마다 결전은 싫었다**". PC Gamer "계속 플러팅만 할 순 없다 — 대회가 있으니까".
- **관계 그라인드**: 가이드 3종 "행아웃은 함정" / 스팀 "**슬라이스 오브 라이프를 즐길 수 없다, 시간이 아까워서**", "최적 플레이를 강요한다" / 1인 로맨스 락 → 회차 반복 강요.
- **페이싱**: RPGFan "20시간쯤 놀라움이 끝나고 그라인드가 시작", 중반 이후 새 메커닉 없음. 후반 골드 과잉·서비스 무가치(§4).
- **튜토리얼·첫 주**: "1주차는 튜토리얼 때문에 며칠 더 필요"(Witch's), "첫 대회 전 1주 유예가 있었어야"(스팀). 소수는 "1주차 밸런스가 딱 좋았다".
- 톤: Siliconera "**밝고 낙천적인 톤 vs 처벌적 일정**의 부조화"(기존 문서 §평가와 동일).

**[사실] 개발사 대응 = 문제 인정 지점**
- 출시 2일 뒤 **10/19/22 패치**: Roxanne·Corsac·Finn 요구 포션 하향, 관련 재료 드랍률 상향, 남획 이벤트 확률 하향.
- **Masterwork(2024-10-22)**: Cozy = **이동 0 · 랭크업 0 · (행아웃은 여전히 소모) · 재료 1개 양조 · 보스 완화**; Classic 리밸런스(초반 쉽게·후반 어렵게); Capitalism(+20%); Endless; **Free Love**; 성우; Finn DLC; **Day 3 이후 난이도 자유 변경**. Masterwork 리뷰: "Cozy에서도 만만치 않다", "자율성은 여전히 제한적"(Tech-Gaming 73).

**[해석]**
- 개발사가 인정한 것: ① 관계의 **관리 비용**(이동·랭크업)이 과했다 ② 1인 로맨스 락이 리플레이를 강요했다 ③ 대회 스파이크 ④ 무성우 ⑤ 후반 콘텐츠 부재. 주목할 점은 행아웃 시간은 Cozy에서도 남겼다는 것 — "시간을 써서 사람을 만난다"는 판타지는 지키고 **잡비만 없앤** 수정이다. 우리 밤(시간 무제한)은 여기서 한 발 더 나간 셈이므로 "선택의 무게"를 다른 데서 만들어야 한다.

출처: [PC Gamer 리뷰](https://www.pcgamer.com/potionomics-review/) · [RPS](https://www.rockpapershotgun.com/potionomics-makes-chucking-a-bunch-of-teeth-into-a-cauldron-feel-great) · [Wikipedia 리셉션(Guardian·RPS 인용)](https://en.wikipedia.org/wiki/Potionomics) · [RPGFan](https://www.rpgfan.com/review/potionomics/) · [Inverse](https://www.inverse.com/gaming/potionomics-review-best-sim-2022) · [Tech-Gaming 원작](https://www.tech-gaming.com/potionomics/) · [Tech-Gaming Masterwork](https://www.tech-gaming.com/potionomics-masterwork/) · [CGMagazine](https://www.cgmagonline.com/review/game/potionomics-pc-review/) · [Siliconera Masterwork](https://www.siliconera.com/review-potionomics-masterwork-edition-feels-like-a-better-deal/) · [Witch's Review Corner](https://witchsreviewcorner.com/2024/12/04/potionomics-masterwork-edition-review-ps5/) · [Rambling Reviews](https://ramblingreviews.substack.com/p/potionomics) · [스팀 토론 "부정 리뷰는 시간 제약"](https://steamcommunity.com/app/1874490/discussions/0/5254037276327498557/) · [스팀 토론 "Time limits FAR too strict"](https://steamcommunity.com/app/1874490/discussions/0/5254037276325237465/) · [스팀 토론 첫 대회](https://steamcommunity.com/app/1874490/discussions/0/5254037276324715390/) · [Patch 10/19/22](https://steamcommunity.com/games/1874490/announcements/detail/3396302964501602391) · [Game8 Masterwork 업데이트](https://indie.game8.co/news/potionomics-just-got-more-exciting-with-huge-major-update-and-new-dlc/) · [Marvelous 발표](https://marvelousgames.com/news/potionomics-masterwork-edition-out-now) · [Fandom Gamemodes](https://potionomics.fandom.com/wiki/Gamemodes)

---

## 7. 우리 게임 대입

### (a) 구조 검증 — 무엇이 검증됐고 무엇이 조건인가
**[해석]** "밤에 인물을 만나 관계 서브스토리로 카드를 연다"는 구조는 포셔노믹스에서 **리뷰 전반이 가장 좋아한 부분**이다. 성립 조건: ① 카드가 **그 인물의 성격 표현** ② 랭크마다 **확실한 물건**(카드 8·쿠폰 2 = 빈 랭크 없음) ③ 쿠폰이 관계에 **경제적 이유**를 보탬. 실패 조건: ① 관계가 코어 루프의 **시간을 먹을 때** ② 카드 공급 **독점** ③ **대체 가능한 보상**(행아웃 사장). 우리 v0.2는 실패 조건 ①을 이미 제거했다. 남은 위험은 "매일 전원 방문 잡일" — 밤에 만날 인물을 **하루 1에서 2명 결정적 로테이션**(신문 예고)으로 두면 시간 압박 없이 선택만 남는다.

### (b) 예시 두 개를 포셔노믹스 규칙에 대입
1. **비서팀 서큐버스 → "매료" 카드.** 포셔노믹스 대응물은 Roxanne 라인(Flattery = 매혹으로 가격 +15%, Sleight of Hand = 결점 은폐) — 로잔느는 **정보를 가리는** 매혹, 우리는 **정보를 여는** 매혹. 스케치: 랭크 1 "윙크"(긴장 소폭 하강 + tell 창 힌트) → 랭크 3 "매료"(**다음 답변 거짓 불가** = 채널 강제 개방, Opener/Closer 문법처럼 "마지막 질문 전용") → 랭크 4 쿠폰 대응물 "소문 할인"(정보 아이템 −20%) → 랭크 7 서브스토리(매료를 "잔업"으로 여기는 코미디). 가드레일: 정답기 위험이 큰 카드이므로 **1일 1회 + 사용 시 지원자 긴장 급등** — 기존 문서 §시사점 4의 클램프 규칙 준수.
2. **뇌물 인사청탁 서브스토리.** 포셔노믹스에 선례 없음. 빌릴 것은 두 조각: 커스텀 주문의 **"수락 → 납품 의무 → 호감 보상"** 골격과 라이벌 이벤트의 **"사건이 다음날 규칙을 바꾼다"**. 스케치: 밤 방문객(오크 족장) → 봉투 수락 시 다음날 지침에 **플레이어만 아는 비밀 지침 "특채 1명"** 추가 → 지키면 관계·골드, 어기면 석간 "협박" 기사와 분기; 거절하면 청렴 공적. 도덕 분기 자체는 Papers, Please 계보에서 설계.

### (c) 재발 경고와 회피책
- **관계 그라인드**: 포셔노믹스는 랭크업 100회 × 슬롯. 우리 하루가 5에서 7분이면 밤이 2분을 넘는 순간 비율이 무너진다 → 인물 이벤트 **1일 1건**, 랭크 **3에서 5**, "은행-인출"은 유지하되 인출 비용 0.
- **시간 압박의 변종**: 인물 로테이션이 **RNG**면 재료 RNG 불만("세이브 스컴")이 재발 → 로테이션은 결정적(요일제 + 신문 예고).
- **과잉 튜토리얼**: "하루 한 개념" 튜토리얼은 호평받았지만 1주차 슬롯을 갉아먹었다. 데모 3일에서 밤까지 설명하면 낮 튜토리얼과 겹친다 → 밤은 **설명 텍스트 0, 만지면 알게**(잠긴 물건의 코믹 문구만).
- **톤 부조화**: 코지 톤 vs 처벌 구조가 최대 불만. 우리 재발 형태 = 뇌물 서브스토리가 "실패 = 처벌"이 되는 것 → 결과는 **신문 기사로만**, 골드·공적 몰수 금지("긴장은 낮의 몫").
- **대체 가능 보상**: 밤 활동마다 유일 보상 — 정보는 소문, 카드는 인물, 골드는 미니게임에서만.
- **후반 골드 과잉**: 방 꾸미기 장기 싱크 유지; 할인 쿠폰은 골드 가치를 낮추므로 후반 한정.

### (d) 데모(15에서 20분, 3일)에 밤 파트를 얼마나 넣을지
**[해석] 권장 = 축소판(맛보기 1건 이상, 전체 시스템 미만).** Day 1 밤 = 신문·월급·잠긴 티저 / **Day 2 밤 = 인물 방문 1건**(서큐버스 랭크 1 장면 + 카드 1장) → Day 3 사기 부서의 날에 그 카드를 쓴다 / Day 3 밤 = 엔딩 신문. 근거: 가장 호평받은 순간이 **"랭크업 → 새 카드 → 다음 흥정에서 써 본다"의 즉시 순환**이므로 데모에서 이 순환을 한 번 완주시켜야 "밤이 있는 게임"임이 증명된다. 완전 제외는 반대(성장·언락 판타지 검증 불가), 뇌물 서브스토리는 제외(분기 저작 비용 + 3일로는 결과 회수 불가). 밤 1회 90초 이내 목표.

---

## 결정 포인트 3개 (설계에 바로 영향)
1. **관계 전용 카드의 범위** — 포셔노믹스형 독점(관계로만) vs 상점 매매 병행. 권장: 병행하되 관계 전용은 "채널 강제 개방/조작"류 대체 불가 효과 소수 정예.
2. **밤 인물 접근 방식** — 무제한 전원 방문 vs **결정적 로테이션 1에서 2명**(신문 예고). 권장: 로테이션.
3. **호감 축적/인출 구조와 랭크 보상 종류** — 랭크 3에서 5 · "은행-인출"(인출 비용 0) · 보상 = 카드/소문/서비스. 인물별 서비스(쿠폰 축)를 둘지는 까마귀 상점 단일 NPC 유지 여부와 함께 결정.
