/* Scene UI, not a new stock illustration: reuse a window-free crop of the
 * original interior, with a stateful table layer. Actual text remains accessible.
 */
(function(root){'use strict';
 root.LWHStoryPlaceView=function(container){
  const room=document.createElement('div');room.id='storyPlaceView';room.hidden=true;room.setAttribute('role','img');
  const background=document.createElement('div');background.className='story-interior';
  const sign=document.createElement('div');sign.className='story-place-sign';
  const seat=document.createElement('div');seat.className='story-seat-back';
  const table=document.createElement('div');table.className='story-table';
  const setting=document.createElement('div');setting.className='story-setting';
  const food=document.createElement('div');food.className='story-food';
  const cup=document.createElement('div');cup.className='story-cup';cup.textContent='';
  const card=document.createElement('div');card.className='story-table-card';
  setting.append(food);table.append(setting,cup,card);room.append(background,sign,seat,table);container.append(room);
  return {render(view){
   room.hidden=view?.presentation!=='diner';if(room.hidden)return;
   room.dataset.table=view.table;room.dataset.seat=view.seat;
   sign.textContent=view.seat==='counter'?'COUNTER • '+view.kitchenStatus:'BOOTH • '+view.kitchenStatus;
   const labels={soup:'Soup & bread',breakfast:'All-day breakfast',coffee:'Coffee & toast',wrong:'Not your order',empty_plate:'Thank you',empty:'Your table'};
   card.textContent=labels[view.table]||'Your table';
   room.setAttribute('aria-label','Diner '+view.seat+'. '+(view.table==='empty'?'A clear place setting; your food has not arrived.':view.table==='empty_plate'?'An empty plate after your meal.':labels[view.table]+' has been served.'));
  }};
 };
})(typeof globalThis!=='undefined'?globalThis:this);
