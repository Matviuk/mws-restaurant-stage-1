let restaurant;var map;navigator.serviceWorker&&navigator.serviceWorker.register("/sw.js",{scope:"./"}).then(function(e){console.log("Registration succeeded. Scope is "+e.scope)}).catch(function(e){console.log("Registration failed with "+e)}),document.addEventListener("DOMContentLoaded",e=>{fetchRestaurantFromURL((e,t)=>{e?console.error(e):fillBreadcrumb()})}),window.initMap=(()=>{fetchRestaurantFromURLForMap((e,t)=>{e?console.error(e):(self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:t.latlng,scrollwheel:!1}),DBHelper.mapMarkerForRestaurant(self.restaurant,self.map))})}),fetchRestaurantFromURLForMap=(e=>{if(self.restaurant)return void e(null,self.restaurant);const t=getParameterByName("id");t?DBHelper.fetchRestaurantById(t,(t,n)=>{self.restaurant=n,n?e(null,n):console.error(t)}):(error="No restaurant id in URL",e(error,null))}),fetchRestaurantFromURL=(e=>{if(self.restaurant)return void e(null,self.restaurant);const t=getParameterByName("id");t?DBHelper.fetchRestaurantById(t,(t,n)=>{self.restaurant=n,n?(fillRestaurantHTML(),e(null,n)):console.error(t)}):(error="No restaurant id in URL",e(error,null))}),fillRestaurantHTML=((e=self.restaurant)=>{const t=document.getElementById("restaurant-name");t.innerHTML=e.name,t.setAttribute("aria-label",`${e.name} restaurant`);const n=document.getElementById("restaurant-address");if(n.innerHTML=e.address,n.setAttribute("aria-label",`Address: ${e.address}`),e.photograph){const t=document.getElementById("restaurant-img"),n=document.createElement("source"),r=document.createElement("source"),a=document.createElement("source"),o=document.createElement("source"),i=document.createElement("source"),s=document.createElement("source"),c=document.createElement("img");t.className="restaurant-img",n.dataset.srcset=`/img/${e.photograph}-680.webp`,n.media="(min-width: 471px) and (max-width: 760px), (min-width: 941px) and (max-width: 1520px)",n.type="image/webp",t.append(n),r.dataset.srcset=`/img/${e.photograph}-390.webp`,r.media="(max-width: 470px), (min-width: 841px) and (max-width: 940px)",r.type="image/webp",t.append(r),a.dataset.srcset=`/img/${e.photograph}-original.webp`,a.media="(min-width: 761px) and (max-width: 840px), (min-width: 1521px)",a.type="image/webp",t.append(a),o.dataset.srcset=`/img/${e.photograph}-680.jpg`,o.media="(min-width: 471px) and (max-width: 760px), (min-width: 941px) and (max-width: 1520px)",o.type="image/jpeg",t.append(o),i.dataset.srcset=`/img/${e.photograph}-390.jpg`,i.media="(max-width: 470px), (min-width: 841px) and (max-width: 940px)",i.type="image/jpeg",t.append(i),s.dataset.srcset=`/img/${e.photograph}-original.jpg`,s.media="(min-width: 761px) and (max-width: 840px), (min-width: 1521px)",s.type="image/jpeg",t.append(s),c.src=`/img/${e.photograph}-15.jpg`,c.dataset.src=`/img/${e.photograph}-original.jpg`,c.alt=`${e.name} restaurant's photo`,t.append(c)}document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,e.operating_hours&&fillRestaurantHoursHTML(),fillReviewsHTML();const r=window.document.querySelectorAll("source, img");let a,o=e=>{e.dataset&&e.dataset.src&&(e.src=e.dataset.src),e.dataset&&e.dataset.srcset&&(e.srcset=e.dataset.srcset)},i=e=>{e.forEach(e=>{e.intersectionRatio>0&&(a.unobserve(e.target),o(e.target))})};"IntersectionObserver"in window?(a=new IntersectionObserver(i,{rootMargin:"0px",threshold:.1}),r.forEach(e=>{a.observe(e)})):Array.from(r).forEach(e=>o(e))}),fillRestaurantHoursHTML=((e=self.restaurant.operating_hours)=>{const t=document.getElementById("restaurant-hours");for(let n in e){const r=document.createElement("tr"),a=document.createElement("td");a.innerHTML=n,r.appendChild(a);const o=document.createElement("td");o.innerHTML=e[n],r.appendChild(o),t.appendChild(r)}}),fillReviewsHTML=((e=self.restaurant.reviews)=>{const t=document.getElementById("reviews-container"),n=document.createElement("h2");if(n.innerHTML="Reviews",t.appendChild(n),!e){const e=document.createElement("p");return e.innerHTML="No reviews yet!",void t.appendChild(e)}const r=document.getElementById("reviews-list");e.forEach(e=>{r.appendChild(createReviewHTML(e))}),t.appendChild(r)}),createReviewHTML=(e=>{const t=document.createElement("li");t.tabindex=0;const n=document.createElement("h3"),r=document.createElement("span");r.className="review-name",r.innerHTML=e.name,n.appendChild(r);const a=document.createElement("span");a.innerHTML=e.date,a.setAttribute("class","review-date"),n.appendChild(a),t.appendChild(n);const o=document.createElement("p");o.className="review-rating",o.innerHTML=`Rating: ${e.rating}`,t.appendChild(o);const i=document.createElement("p");return i.innerHTML=e.comments,t.appendChild(i),t}),fillBreadcrumb=((e=self.restaurant)=>{const t=document.getElementById("breadcrumb"),n=document.createElement("li");n.innerHTML=e.name,t.appendChild(n)}),getParameterByName=((e,t)=>{t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");const n=new RegExp(`[?&]${e}(=([^&#]*)|&|#|$)`).exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null});class DBHelper{static get DATABASE_URL(){return"http://localhost:1337/restaurants"}static openDatabase(){return idb.open("RestReview",1,function(e){let t=e.createObjectStore("restaurants",{keyPath:"id"});t.createIndex("cuisine","cuisine_type"),t.createIndex("neighborhood","neighborhood")})}static fetchRestaurants(e){return new Promise((e,t)=>{DBHelper.openDatabase().then(t=>{if(!t)return;t.transaction("restaurants").objectStore("restaurants").getAll().then(t=>{t&&t.length>0&&e(t),fetch(DBHelper.DATABASE_URL).then(e=>e.json()).then(t=>(DBHelper.openDatabase().then(e=>{if(!e)return e;let n=e.transaction("restaurants","readwrite").objectStore("restaurants");t.forEach(e=>n.put(e))}),e(t))).catch(e=>requestError(e,"Restaurants request from web failed"))})})})}static fetchRestaurantById(e,t){DBHelper.openDatabase().then(n=>{if(!n)return;n.transaction("restaurants").objectStore("restaurants").get(parseInt(e)).then(n=>{if(n&&n.name.length>0)return t(null,n);fetch(DBHelper.DATABASE_URL+"/"+e).then(e=>e.json()).then(e=>(DBHelper.openDatabase().then(t=>{if(!t)return t;t.transaction("restaurants","readwrite").objectStore("restaurants").put(e)}),t(null,e))).catch(e=>t("Restaurant request from web failed",null))}).catch(e=>t("Restaurant does not exist",null))})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){DBHelper.fetchRestaurants().then(r=>{"all"!=e&&(r=r.filter(t=>t.cuisine_type==e)),"all"!=t&&(r=r.filter(e=>e.neighborhood==t)),n(null,r)}).catch(e=>n(e,null))}static fetchNeighborhoods(e){DBHelper.fetchRestaurants().then(t=>{const n=t.map((e,n)=>t[n].neighborhood),r=n.filter((e,t)=>n.indexOf(e)==t);e(null,r)}).catch(t=>e(t,null))}static fetchCuisines(e){DBHelper.fetchRestaurants().then(t=>{const n=t.map((e,n)=>t[n].cuisine_type),r=n.filter((e,t)=>n.indexOf(e)==t);e(null,r)}).catch(t=>e(t,null))}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return!!e.photograph&&`/img/${e.photograph}-original.jpg`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}}!function(){function e(e){return new Promise(function(t,n){e.onsuccess=function(){t(e.result)},e.onerror=function(){n(e.error)}})}function t(t,n,r){var a,o=new Promise(function(o,i){e(a=t[n].apply(t,r)).then(o,i)});return o.request=a,o}function n(e,t,n){n.forEach(function(n){Object.defineProperty(e.prototype,n,{get:function(){return this[t][n]},set:function(e){this[t][n]=e}})})}function r(e,n,r,a){a.forEach(function(a){a in r.prototype&&(e.prototype[a]=function(){return t(this[n],a,arguments)})})}function a(e,t,n,r){r.forEach(function(r){r in n.prototype&&(e.prototype[r]=function(){return this[t][r].apply(this[t],arguments)})})}function o(e,n,r,a){a.forEach(function(a){a in r.prototype&&(e.prototype[a]=function(){return e=this[n],(r=t(e,a,arguments)).then(function(e){if(e)return new s(e,r.request)});var e,r})})}function i(e){this._index=e}function s(e,t){this._cursor=e,this._request=t}function c(e){this._store=e}function u(e){this._tx=e,this.complete=new Promise(function(t,n){e.oncomplete=function(){t()},e.onerror=function(){n(e.error)},e.onabort=function(){n(e.error)}})}function l(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new u(n)}function p(e){this._db=e}n(i,"_index",["name","keyPath","multiEntry","unique"]),r(i,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),o(i,"_index",IDBIndex,["openCursor","openKeyCursor"]),n(s,"_cursor",["direction","key","primaryKey","value"]),r(s,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(t){t in IDBCursor.prototype&&(s.prototype[t]=function(){var n=this,r=arguments;return Promise.resolve().then(function(){return n._cursor[t].apply(n._cursor,r),e(n._request).then(function(e){if(e)return new s(e,n._request)})})})}),c.prototype.createIndex=function(){return new i(this._store.createIndex.apply(this._store,arguments))},c.prototype.index=function(){return new i(this._store.index.apply(this._store,arguments))},n(c,"_store",["name","keyPath","indexNames","autoIncrement"]),r(c,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),o(c,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),a(c,"_store",IDBObjectStore,["deleteIndex"]),u.prototype.objectStore=function(){return new c(this._tx.objectStore.apply(this._tx,arguments))},n(u,"_tx",["objectStoreNames","mode"]),a(u,"_tx",IDBTransaction,["abort"]),l.prototype.createObjectStore=function(){return new c(this._db.createObjectStore.apply(this._db,arguments))},n(l,"_db",["name","version","objectStoreNames"]),a(l,"_db",IDBDatabase,["deleteObjectStore","close"]),p.prototype.transaction=function(){return new u(this._db.transaction.apply(this._db,arguments))},n(p,"_db",["name","version","objectStoreNames"]),a(p,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(e){[c,i].forEach(function(t){e in t.prototype&&(t.prototype[e.replace("open","iterate")]=function(){var t,n=(t=arguments,Array.prototype.slice.call(t)),r=n[n.length-1],a=this._store||this._index,o=a[e].apply(a,n.slice(0,-1));o.onsuccess=function(){r(o.result)}})})}),[i,c].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,t){var n=this,r=[];return new Promise(function(a){n.iterateCursor(e,function(e){e?(r.push(e.value),void 0===t||r.length!=t?e.continue():a(r)):a(r)})})})});var d={open:function(e,n,r){var a=t(indexedDB,"open",[e,n]),o=a.request;return o.onupgradeneeded=function(e){r&&r(new l(o.result,e.oldVersion,o.transaction))},a.then(function(e){return new p(e)})},delete:function(e){return t(indexedDB,"deleteDatabase",[e])}};"undefined"!=typeof module?(module.exports=d,module.exports.default=module.exports):self.idb=d}();
//# sourceMappingURL=restaurant-info.js.map
