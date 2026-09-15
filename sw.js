// 마리 상담 일정 공유판 — 홈 화면 앱 설치를 위한 서비스워커
//
// 전략: 네트워크 우선(network-first).
//  - 인터넷이 되면 항상 서버의 최신 파일을 씁니다. 그래서 새 버전을 올리면 바로 반영돼요.
//  - 인터넷이 끊기면 마지막으로 받아둔 화면을 대신 보여줍니다.
//  - 파이어베이스·구글 폰트 같은 바깥 주소는 건드리지 않습니다. (실시간 동기화를 막으면 안 되니까요)

var CACHE = 'mari-schedule-v2';

self.addEventListener('install', function(){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch(err){ return; }
  if(url.origin !== self.location.origin) return;   // 바깥 주소는 그대로 통과

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        if(hit) return hit;
        if(req.mode === 'navigate') return caches.match('./');
        return Response.error();
      });
    })
  );
});
