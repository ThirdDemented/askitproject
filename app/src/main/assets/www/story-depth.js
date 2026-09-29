/* Release-intended diner storyline and callbacks. All clocks are GAME minutes.
 * Content is finite, authored, and saved. Reading never rerolls or advances it.
 * The alpha1 diner remains available only to finish already-active older saves.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.LWHStoryDepth=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const d=s=>s.trip.active.data;
  const line=(speaker,text)=>({speaker,text});
  const node=(id,label,to,extra={})=>({id,label,...extra,apply:extra.apply||((s)=>{s.trip.active.node=to;})});
  const finish=(id,label,text,extra={})=>node(id,label,'done',{...extra,apply:(s,c)=>{extra.effect?.(s,c);c.finish(typeof text==='function'?text(s):text);}});
  const exit=()=>[node('exit','Return to the road',null,{apply:s=>{s.trip.active=null;}})];
  const meals=[{id:'soup',label:'Soup and bread',price:1200,relief:30},{id:'breakfast',label:'All-day breakfast',price:2200,relief:55},{id:'coffee',label:'Coffee and toast',price:500,relief:14}];
  const topics={
    parts:{speaker:'HAL',tease:'“I told the seller I needed a car. He said this was most of one.”',
      reply:'“Bought it this morning. It got as far as this diner. Seller says the warranty expired when I left his driveway.”',
      answer:'“One click, then nothing. Lights still work. A mechanic looked through the window and said the electrical connection needs attention. The seller suggested positive thinking.”',
      ending:'“I am moving to help my sister. I bought the car with my moving money. If it stays here, apparently I live at the diner now.”'},
    boat:{speaker:'LEON',tease:'“Technically, anything is a boat once.”',
      reply:'“The advertisement said HOUSEBOAT. It was a shed on a trailer. I asked where the boat part was. He pointed at a puddle.”',
      answer:'“No, I did not buy it. I bought the trailer. The shed was apparently a free gift that is still legally my problem.”',
      ending:'“Now the marina says I need a slip. I told them it needs a driveway. Neither of us is enjoying the conversation.”'},
    tow:{speaker:'DRIVER',tease:'“The tow truck broke down while it was towing my car.”',
      reply:'“Second tow truck arrived, driver looked at the first one and said, ‘Oh, not again.’ Not the greeting I wanted.”',
      answer:'“They sent a bigger truck. At some point this stopped being transportation and became a family tree.”',
      ending:'“Both cars are at the shop now. I walked here. They offered to tow me, but I said I had been through enough.”'},
    festival:{speaker:'LOCAL',tease:'“The giant spoon is the second-biggest thing in town.”',
      reply:'“Biggest is the argument about whether it is a spoon or a ladle. Council has been in special session since May.”',
      answer:'“It is at the county fairgrounds. Public parking. You can look without joining either side.”',
      ending:'“They cancelled the ribbon cutting after somebody brought soup. Apparently that was a political statement.”'},
    dog:{speaker:'TRAVELER',tease:'“He has a service vest. The service is mostly shedding.”',
      reply:'“It is a seat-belt harness, not a service-animal vest. My brother printed ROADSIDE ASSISTANCE on it.”',
      answer:'“His only qualification is finding the window button. That is still more than the last mechanic managed.”',
      ending:'“We are going to see the ocean. He has never seen it. He is going to try to drink it. I can already feel the vet bill.”'},
    pie:{speaker:'REGULAR',tease:'“That pie has won three county fairs.”',
      reply:'“The recipe, I mean. Not this specific pie. People keep asking that now.”',
      answer:'“Cherry. The secret ingredient is the cook refusing to tell anyone the secret ingredient.”',
      ending:'“Last year they gave it second place. Cook offered the judge a job because clearly he knew so much.”'}
  };
  function job(s){return s.world.flags.partsJob;}
  function remember(s,id,amount=0){
    const n=s.world.npcs[id]||(s.world.npcs[id]={meetings:0,trust:0});
    n.trust=Math.max(-100,Math.min(100,n.trust+amount));return n;
  }
  function site(s){return d(s).site||'diner:Roadside';}
  function server(s){return d(s).server||'SERVER';}
  function topic(s){return topics[d(s).topic]||topics.pie;}
  function chooseTopic(c,ids,recent){
    const pool=ids.filter(x=>!recent.includes(x));
    return c.weighted((pool.length?pool:ids).map(id=>({id,weight:id==='quiet'?2:3})));
  }
  function enterSeat(s,seat){
    d(s).seat=seat;d(s).topic=d(s)[seat+'Topic'];
    const seen=s.world.flags.dinerTopics||[];
    s.world.flags.dinerTopics=[...seen,d(s).topic].slice(-3);
    const n=remember(s,site(s)+'.server');n.meetings++;
    s.trip.active.node='menu';
  }
  function cooking(s){return d(s).kitchen&&d(s).meal&&!d(s).served;}
  function remaining(s){return Math.max(0,12-(d(s).kitchen?.elapsed||0));}
  function kitchenGate(s){
    const k=d(s).kitchen;
    if(!k)throw Error('No ordered meal');
    if(!k.delivered){k.delivered=true;s.trip.active.node=k.outcome;}else s.trip.active.node='ready';
  }
  function resolveKitchen(s){d(s).served=true;s.trip.active.node='ready';}
  function kitchenNotice(s){
    if(!cooking(s)||d(s).kitchen.elapsed<12||d(s).kitchen.delivered)return [];
    const outcome=d(s).kitchen.outcome;
    return [line('SOUND',outcome==='outage'?'[The kitchen lights go out while you talk.]':outcome==='wrong'?'[A bell rings. The cook calls out the wrong order number.]':'[The serving bell rings. Your food is waiting at the pass.]')];
  }
  function waitAction(id,label,extra={}){
    return node(id,label,'ready',{minutes:remaining(extra.state),apply:(s,c)=>{extra.effect?.(s,c);kitchenGate(s);}});
  }
  function settleJob(s,status){
    const j=job(s);if(!j||!['accepted','attempted'].includes(j.status))throw Error('No open favor to settle');
    j.status=status;j.resolvedAtMiles=s.trip.distance||0;j.dueAtMiles=(s.trip.distance||0)+90;j.resolvedAtMinute=s.trip.minutes;
    j.callbackDone=false;
    remember(s,'hal',status==='repaired'?4:status==='referred'?2:status==='botched'?-3:0);
    const n=remember(s,site(s)+'.server');n.note=status;
  }
  function payAction(id,label,tip){
    return node(id,label,'done',{costCents:s=>d(s).billCents+(tip?300:0),settlesBill:true,minutes:2,apply:(s,c)=>{
      if(tip){remember(s,site(s)+'.server',3).tipped=true;}
      if(d(s).helpAccepted&&job(s)?.status==='accepted')s.trip.active.node='after_meal';
      else c.finish(tip?'Lunch paid. The server thanks you for the tip. Back to your own trip.':'Fed, paid up, and back at the car.');
    }});
  }
  const diner={
    start(s,c){
      const place='diner:'+s.trip.location;
      const recent=s.world.flags.dinerTopics||[];
      const hasParts=!job(s);
      Object.assign(d(s),{depth:2,site:place,server:'MARNIE',billCents:0,meal:null,served:false,eaten:false,helpAccepted:false,
        counterTopic:chooseTopic(c,['pie','festival','tow','quiet',...(hasParts?['parts']:[])],recent),
        boothTopic:chooseTopic(c,['boat','dog','tow','quiet',...(hasParts?['parts']:[])],recent),
        // One independent kitchen draw, fixed before any attention choice.
        kitchen:{outcome:c.weighted([{id:'ready',weight:78},{id:'wrong',weight:12},{id:'outage',weight:10}]),elapsed:0,delivered:false},
        opening:remember(s,place+'.server').meetings>0?'return':'first'});
      if(!s.world.flags.firstDiner)s.world.flags.firstDiner=place;
      if(s.world.flags.firstDiner!==place)d(s).server='SERVER';
    },
    afterAction(s,before,action){
      if(before.trip.active.data.meal&&!before.trip.active.data.served&&s.trip.active?.scene==='diner'){
        d(s).kitchen.elapsed+=action.minutes||0;
      }
    },
    describe(s){
      const a=s.trip.active, x=d(s), t=topic(s), n=rememberRead(s,site(s)+'.server');
      const seat=x.seat==='counter'?'at the counter':'in the next booth';
      let title='',lines=[];
      switch(a.node){
        case 'arrival':title='THE DINER IS OPEN.';lines=[line('SCENE','You pull into a diner near '+s.trip.location+'. You can eat, talk, or leave without making somebody else’s day your problem.')];break;
        case 'seat':title=x.opening==='return'?'BACK AT THE SAME DINER.':'PICK A SEAT.';lines=[line(server(s),x.opening==='return'?(n.note==='repaired'?'“Hal made it out of the lot. He says thanks. Coffee?”':n.tipped?'“You are back. Thanks again for the tip. Counter or booth?”':'“Welcome back. Your usual seat is free.”'):'“Counter is open. Booths are self-seating.”'),line('SCENE','The counter puts you beside the server and the regulars. The booths are quieter, but voices carry over the seat backs.')];break;
        case 'menu':title='WHAT ARE YOU HAVING?';lines=[line(server(s),'“Soup and bread, breakfast all day, or coffee and toast. Prices include the meal. Tip is your call.”'),line('SCENE','Your meal money is reserved until you pay. You have not been charged yet.')];break;
        case 'waiting':title='THE KITCHEN HAS YOUR ORDER.';lines=[line('SOUND','[Dishes clatter. The griddle hisses. A chair scrapes.]'),line(server(s),'“Order is in. Make yourself comfortable.”'),x.topic==='quiet'?line('SCENE','For the moment the other conversations are indistinct. You can leave them that way.'):line(t.speaker+' '+seat.toUpperCase(),t.tease)];break;
        case 'conversation':title='SOMEBODY TURNS TOWARD YOU.';lines=[line(t.speaker,t.reply)];break;
        case 'answer':title='THE PROBLEM, APPARENTLY.';lines=[line(t.speaker,t.answer)];break;
        case 'story_answer':title='THE REST OF THE STORY.';lines=[line(t.speaker,t.ending)];break;
        case 'server_reply':title='THE SERVER LEANS ON THE COUNTER.';lines=[line(server(s),n.tipped?'“I remember you. I was having a rotten shift last time. That tip helped.”':'“Passing through? A good lunch should not require your entire life story. But people bring one anyway.”'),line(server(s),x.seat==='counter'?(job(s)?'“Hope the next stretch treats you better. More coffee?”':'“Hal over there is having car trouble. Only ask if you actually want to know.”'):'“You picked the quiet side. I can leave you in peace.”')];break;
        case 'help_offer':title='AFTER LUNCH, IN THE PARKING LOT.';lines=[line('HAL','“Forty-five dollars if you get it running. No promises? Fair enough. I have had plenty of promises today.”'),line(server(s),'“Eat first. The car is already not going anywhere.”')];break;
        case 'ready':title='FOOD, AT LAST.';lines=[...(x.placemat?[line('SCENE','The placemat lists a giant spoon at the county fairgrounds. Admission: free. Judgement: ongoing.')]:[]),line(server(s),'“'+x.meal.label+'. Here you go.”')];break;
        case 'wrong':title='THAT IS NOT YOUR ORDER.';lines=[line(server(s),'“Hold on. This was for the next table. I can replace it, or you can keep it for your original price.”')];break;
        case 'outage':title='THE KITCHEN GOES DARK.';lines=[line('SOUND','[The exhaust fan winds down. Somebody swears once, professionally.]'),line(server(s),'“Generator will take twenty-five minutes. Your food is cooked but cooling. Four dollars off if you take it now, or cancel. No hard feelings.”')];break;
        case 'pay':title='THE BILL ARRIVES.';lines=[line(server(s),'“Hope the rest of your trip treats you decently.”'),line('SCENE','The meal is finished. Your reserved money covers the bill.')];break;
        case 'after_meal':title='LUNCH IS PAID FOR.';lines=[line('HAL','“Still willing to look? Absolutely fine if you need to get going.”'),line('SCENE','You can keep your offer or change your mind. The meal is already settled.')];break;
        case 'parking':title='HAL’S PARTS CAR.';lines=[line('SCENE','Hal’s old sedan is parked beside yours. A price sticker is still taped to the windshield.'),line('HAL','“I peeled off the word RELIABLE. Felt like evidence tampering.”')];break;
        case 'diagnose_hal':title='A SMALL JOB. POSSIBLY.';lines=[line('SCENE','You find an unreliable electrical connection. The problem looks fixable, not guaranteed. This is Hal’s vehicle, not yours.'),line('HAL','“If you are not comfortable doing it, I would rather hear that before anything starts smoking.”')];break;
        case 'job_result':title=x.jobResult==='repaired'?'IT STARTS.':'NOT THE MIRACLE YOU ORDERED.';lines=[line('SCENE',x.jobResult==='repaired'?'The connection holds and the sedan starts. Hal hands over the agreed $45. You did not repair or damage your own vehicle.':x.jobResult==='botched'?'You get impatient, make the connection worse, and stop before doing more damage. Hal will need a shop. You have not been paid.':'Your careful attempt does not solve it. You stop rather than pretend it worked. Hal appreciates the honesty, but still needs another plan.'),line('HAL',x.jobResult==='repaired'?'“That is the nicest noise this car has made all day. Thanks.”':'“All right. What do we do now?”')];break;
        case 'referred':title='A PROFESSIONAL, EVENTUALLY.';lines=[line(server(s),'“I called the shop down the road. They can collect him. No, he does not have to buy another lunch.”'),line('HAL','“Thanks for not just vanishing. I will see you down the road.”')];break;
        case 'done':title='BACK TO YOUR OWN TRIP.';lines=[line('SCENE',s.trip.lastResult.text)];break;
        default:throw Error('Unknown depth diner node: '+a.node);
      }
      if(!['waiting','ready','wrong','outage','pay','done','after_meal','parking','diagnose_hal','job_result','referred'].includes(a.node))lines.push(...kitchenNotice(s));
      const outdoor=['arrival','parking','diagnose_hal','job_result','referred','done'].includes(a.node);
      return {title,lines,body:lines.map(l=>l.speaker+': '+l.text).join('\n\n'),art:outdoor&&a.node!=='arrival'?'supplies':'diner',
        presentation:outdoor?'outside':'diner',table:['ready','wrong'].includes(a.node)?(a.node==='wrong'?'wrong':x.meal?.id):a.node==='pay'?'empty_plate':'empty',
        seat:x.seat||'booth',location:s.trip.location,kitchenStatus:x.meal?(x.served?'SERVED':x.kitchen.elapsed>=12?'ORDER AT THE PASS':'COOKING'):'NOT ORDERED'};
    },
    choices(s){
      const x=d(s), t=topic(s), moneyPaid=job(s)?.status==='repaired';
      const finishTalk=()=>waitAction('finish_talking','Return to your food',{state:s});
      const noJob=()=>!job(s)||job(s).status==='offered';
      switch(s.trip.active.node){
        case 'arrival':return [node('enter','Go inside','seat',{minutes:2}),finish('leave','Keep driving','You leave without buying anything or owing anyone an explanation.')];
        case 'seat':return [node('counter','Sit at the counter — beside the regulars','menu',{apply:s=>enterSeat(s,'counter')}),node('booth','Take a booth — quieter, but not soundproof','menu',{apply:s=>enterSeat(s,'booth')})];
        case 'menu':return [...meals.map(m=>node(m.id,m.label,'waiting',{reserveCents:m.price,apply:s=>{d(s).meal={...m};s.trip.active.node='waiting';}})),finish('leave','Leave without ordering','You return to the car. No meal, no bill.')];
        case 'waiting':return [waitAction('wait','Mind your business and wait for food',{state:s}),waitAction('placemat','Read the attractions placemat',{state:s,effect:s=>{d(s).placemat=true;s.world.flags.sawGiantSpoonAd=true;}}),
          node('engage','Ask about what you overheard','conversation',{minutes:3,when:s=>d(s).topic!=='quiet'&&!d(s).engaged,apply:s=>{d(s).engaged=true;s.trip.active.node='conversation';}}),
          node('chat','Chat with the server','server_reply',{minutes:3,when:s=>!d(s).chatted,apply:s=>{d(s).chatted=true;s.trip.active.node='server_reply';}}),
          finish('cancel','Cancel your order and leave','Your order is cancelled. No meal, no bill.',{effect:s=>{d(s).billCents=0;}})];
        case 'conversation':return [node('talk_car',x.topic==='parts'?'Ask what happened before the car stopped':'Ask a follow-up question','answer',{minutes:3}),node('listen_story','Listen to the rest of the story','story_answer',{minutes:3}),node('excuse','Excuse yourself and return to waiting','waiting')];
        case 'answer':case 'story_answer':return [node('offer_help','Offer to look at Hal’s car after lunch','help_offer',{minutes:2,when:s=>d(s).topic==='parts'&&noJob(),apply:s=>{d(s).helpAccepted=true;s.world.flags.partsJob={status:'accepted',site:site(s),offeredAtMiles:s.trip.distance||0};s.trip.active.node='help_offer';}}),node('hear_more',s.trip.active.node==='answer'?(x.topic==='parts'?'Ask why Hal is moving':'Ask how the story turned out'):'Ask about the practical details',s.trip.active.node==='answer'?'story_answer':'answer',{minutes:2,when:s=>!d(s).heardMore,apply:s=>{d(s).heardMore=true;s.trip.active.node=s.trip.active.node==='answer'?'story_answer':'answer';}}),finishTalk()];
        case 'server_reply':return [node('ask_hal','Ask about the traveler’s car','conversation',{minutes:2,when:s=>d(s).seat==='counter'&&noJob(),apply:s=>{d(s).topic='parts';d(s).engaged=true;s.trip.active.node='conversation';}}),finishTalk()];
        case 'help_offer':return [finishTalk()];
        case 'wrong':return [node('correct_order','Wait for your own meal','ready',{minutes:10,apply:resolveKitchen}),node('accept_plate','Keep this plate at the original price','ready',{apply:s=>{d(s).meal={...d(s).meal,label:'the neighboring table’s breakfast',id:'breakfast',relief:55};resolveKitchen(s);}})];
        case 'outage':return [node('cold','Take the cooling meal — $4 off','ready',{apply:s=>{d(s).billCents=Math.max(0,d(s).billCents-400);resolveKitchen(s);}}),node('generator','Wait for the generator','ready',{minutes:25,apply:resolveKitchen}),finish('cancel','Cancel and leave — no charge','The meal is cancelled. You owe nothing.',{effect:s=>{d(s).billCents=0;if(job(s)?.status==='accepted')job(s).status='declined';}})];
        case 'ready':return [node('eat','Eat your meal','pay',{minutes:10,apply:(s,c)=>{d(s).served=true;d(s).eaten=true;s.trip.hunger=c.clamp(s.trip.hunger-d(s).meal.relief);s.trip.morale=c.clamp(s.trip.morale+4);s.trip.active.node='pay';}})];
        case 'pay':return [payAction('pay','Pay the bill',false),payAction('tip','Pay and leave a $3 tip',true)];
        case 'after_meal':return [node('outside','Meet Hal in the parking lot','parking',{minutes:2}),finish('changed_mind','Explain that you need to leave','Hal understands. You do not get paid, and there is no penalty for saying no.',{effect:s=>{job(s).status='declined';}})];
        case 'parking':return [node('inspect_hal','Ask permission and inspect his car','diagnose_hal',{minutes:5}),node('refer_shop','Ask the server to call a local shop','referred',{minutes:15,apply:s=>{settleJob(s,'referred');s.trip.active.node='referred';}}),finish('leave_job','Apologize and get back to your trip','Hal nods. You leave the car to someone equipped to help.',{effect:s=>{job(s).status='declined';}})];
        case 'diagnose_hal':return [node('help_repair','Try a careful repair with your toolkit','job_result',{requires:['toolkit'],minutes:25,apply:(s,c)=>{const success=c.random()<Math.min(.93,.62+s.trip.skills.repair*.12-s.trip.fatigue*.0015);s.trip.fatigue=c.clamp(s.trip.fatigue+3);d(s).jobResult=success?'repaired':'attempted';if(success){settleJob(s,'repaired');c.earn(4500);}else job(s).status='attempted';s.trip.active.node='job_result';}}),
          node('improvise','Bluff and improvise — risk making it worse','job_result',{minutes:15,apply:s=>{settleJob(s,'botched');d(s).jobResult='botched';s.trip.active.node='job_result';}}),
          node('refer_shop','Be honest and arrange a professional','referred',{minutes:15,apply:s=>{settleJob(s,'referred');s.trip.active.node='referred';}})];
        case 'job_result':return [finish('leave_job','Wish Hal luck and return to your car',moneyPaid?'Hal’s engine is running, and you earned $45. You continue your journey.':'You part ways. Hal remembers how you handled the problem.',{when:s=>['repaired','botched'].includes(job(s)?.status)}),node('refer_shop','Help him arrange a local shop','referred',{minutes:15,when:s=>job(s)?.status==='attempted',apply:s=>{settleJob(s,'referred');s.trip.active.node='referred';}}),finish('honest_exit','Admit you cannot solve it and leave','You leave after an honest attempt. Hal will make his own arrangements.',{when:s=>job(s)?.status==='attempted',effect:s=>settleJob(s,'honest')})];
        case 'referred':return [finish('leave_job','Say goodbye and get back on the road','Hal has a plan and a phone number. The favor may matter later.')];
        case 'done':return exit();
        default:throw Error('Unknown diner choice node');
      }
    }
  };
  function rememberRead(s,id){return s.world.npcs[id]||{meetings:0,trust:0};}
  const callback={
    start(s){const j=job(s);if(!j||j.callbackDone||!['repaired','referred','botched','honest'].includes(j.status)||(s.trip.distance||0)<j.dueAtMiles)throw Error('No earned callback is due');d(s).depth=2;d(s).outcome=j.status;},
    describe(s){const j=job(s),done=s.trip.active.node==='done';const lines=done?[line('SCENE',s.trip.lastResult.text)]:[
      line('SCENE','At a rest area, a familiar sedan is parked beside a familiar man. You are '+Math.floor((s.trip.distance||0)-j.resolvedAtMiles)+' miles beyond the diner.'),
      line('HAL',j.status==='honest'?'“I called a shop after you left. They got it running. Thanks for trying and being straight with me.”':j.status==='repaired'?'“Your fix held. I found a spare bottle of coolant in the trunk. Want it? Consider it a thank-you, not a diagnosis.”':j.status==='referred'?'“The shop got me going. You stayed until I had help. Let me put fifteen dollars toward your gas.”':'“The shop fixed it. Your improvisation did not help, but I am moving again. We should probably talk.”')];
      return {title:done?'THE ROAD REMEMBERS.':'HAL, FURTHER DOWN THE ROAD.',lines,body:lines.map(l=>l.speaker+': '+l.text).join('\n\n'),art:'supplies',presentation:'outside'};},
    choices(s){if(s.trip.active.node==='done')return exit();const close=(s)=>{job(s).callbackDone=true;};
      return [finish('accept_thanks','Accept Hal’s thanks',s=>job(s).status==='repaired'?(d(s).alreadyCoolant?'You already have coolant, so Hal gives you $12 for coffee instead. A favor from lunch came back down the road.':'You take the coolant and wish Hal a better second half of the trip. A favor from lunch became something useful ninety miles later.'):'Hal gives you $15 for gas. He remembers you as the person who stayed to help.',{when:s=>['repaired','referred'].includes(job(s).status),effect:(s,c)=>{if(job(s).status==='repaired'){d(s).alreadyCoolant=s.trip.inventory.includes('coolant');if(!s.trip.inventory.includes('coolant'))s.trip.inventory.push('coolant');else {c.earn(1200);}}else c.earn(1500);close(s);remember(s,'hal',1);}}),
        finish('apologize','Own the bad repair and apologize','“Fair enough,” Hal says. It does not undo the repair, but he accepts the apology. You both get back to your trips.',{when:s=>job(s).status==='botched',effect:s=>{close(s);remember(s,'hal',1);}}),
        finish('contribute','Offer $20 toward the shop bill','Hal accepts the contribution. You cannot undo the mistake, but you have settled it between you.',{when:s=>job(s).status==='botched',costCents:2000,effect:s=>{close(s);remember(s,'hal',3);}}),
        finish('wave','Wave and continue your own trip','You acknowledge each other and carry on. No extra obligation.',{effect:close})];}
  };
  const lootPool=[{id:'nothing',weight:55},{id:'receipt',weight:19},{id:'charger',weight:10},{id:'cash',weight:14},{id:'key',weight:2}];
  function carKey(s){return String(s.trip.vehicle.id)+':'+String(s.trip.vehicle.purchaseKey||'original');}
  const discovery={
    start(s,c){d(s).depth=2;const k=carKey(s),all=s.world.flags.carSearches||(s.world.flags.carSearches={});d(s).key=k;d(s).already=!!all[k]?.claimed;
      if(!all[k])all[k]={result:c.weighted(lootPool),cashCents:(12+Math.floor(c.random()*74))*100,claimed:false};d(s).result=all[k].result;},
    describe(s){const a=s.trip.active, x=d(s);let text;
      if(a.node==='done')text=s.trip.lastResult.text;else if(x.already)text='You already searched this vehicle. Same seat, same empty space. You will not find another payout by checking again.';
      else text='You are parked. Something catches beneath the seat while you reach for a receipt. Search, or leave it alone. There may be nothing useful.';
      return {title:a.node==='done'?'UNDER THE SEAT.':'CHECK THE CAR?',body:text,lines:[line('SCENE',text)],art:'supplies',presentation:'outside'};},
    choices(s){if(s.trip.active.node==='done')return exit();return [finish('search','Search beneath the seat',s=>{
      const item=s.world.flags.carSearches[d(s).key];if(d(s).already&&d(s).wasClaimed)return 'Nothing new. The car has not developed a payroll department.';
      return {nothing:'Lint. Not even interesting lint. Nothing gained.',receipt:'A faded receipt and two pens. Apparently the previous owner also ate lunch.',charger:d(s).hadCharger?'Another cable, frayed beyond use. You keep your working charger.':'A working phone charger. You put it with your supplies.',cash:'A folded envelope containing $'+(item.cashCents/100)+'. A lucky find, not a starting allowance.',key:'A small brass key with a motel tag. The number has rubbed off. You keep the odd souvenir.'}[item.result];
    },{minutes:5,effect:(s,c)=>{const item=s.world.flags.carSearches[d(s).key];d(s).wasClaimed=item.claimed;d(s).hadCharger=c.has('charger');if(item.claimed)return;item.claimed=true;if(item.result==='cash')c.earn(item.cashCents);if(item.result==='charger'&&!c.has('charger'))s.trip.inventory.push('charger');if(item.result==='key')s.world.flags.mysteryKeyFound=true;}}),finish('leave','Leave it alone','You leave the space under the seat alone. No reward and no penalty.')];}
  };
  function enhance(base){
    const legacy=base.diner;
    const route=s=>{if(d(s).depth!==undefined&&d(s).depth!==2)throw Error('Unsupported diner content version');return d(s).depth===2?diner:legacy;};
    const combined={start:(s,c)=>(s.trip.experience===2?diner:legacy).start(s,c),describe:s=>route(s).describe(s),choices:s=>route(s).choices(s),afterAction:(s,b,a,c)=>route(s).afterAction?.(s,b,a,c)};
    return {...base,diner:combined,callback,discovery};
  }
  return Object.freeze({enhance,diner,callback,discovery,lootPool,topics});
});
