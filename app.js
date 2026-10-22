const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const app = $("#app");

const defaultContent = {
  pages: {
    headline: "A quieter kind of stay.",
    heroText: "Thoughtful rooms, generous mornings and a little space to settle in.",
    heroImage:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2200&q=86",
    heroAlt: "Stillmere Hotel exterior and pool at dusk",
    dining:
      "Seasonal favourites, freshly brewed coffee and a table worth lingering over. Breakfast is included with every direct stay.",
    hotel:
      "Stillmere is one hotel with one simple idea: make every guest feel settled. Natural textures, gentle light and thoughtful spaces set the pace.",
  },
  rooms: [
    {
      id: "classic",
      name: "Classic Room",
      tag: "YOUR EVERYDAY ESCAPE",
      price: 1250,
      size: 28,
      cap: 2,
      bed: "Queen bed",
      desc: "Soft linen, warm oak and a quiet corner to call your own. Everything you need for an unhurried stay.",
      amenities: ["Complimentary Wi-Fi", "Breakfast included", "Tea & coffee station", "Daily housekeeping"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1800&q=85",
          alt: "Classic guest room with white linen and warm timber furnishings",
        },
        {
          url: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1800&q=85",
          alt: "Quiet hotel bedroom seating area in warm natural tones",
        },
        {
          url: "https://images.unsplash.com/photo-1587985064135-0366536eab42?auto=format&fit=crop&w=1800&q=85",
          alt: "Bright hotel bathroom with stone finishes",
        },
      ],
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      tag: "A LITTLE MORE ROOM",
      price: 1750,
      size: 38,
      cap: 2,
      bed: "King bed",
      desc: "Stretch out in a light-filled room with a king bed, a generous seating area and thoughtful details.",
      amenities: ["Complimentary Wi-Fi", "Breakfast included", "Lounge area", "Espresso station"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1800&q=85",
          alt: "Deluxe guest room with king bed and soft neutral furnishings",
        },
        {
          url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1800&q=85",
          alt: "Sunlit deluxe room with upholstered seating",
        },
        {
          url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1800&q=85",
          alt: "Hotel room reading corner beside a large window",
        },
      ],
    },
    {
      id: "suite",
      name: "Stillmere Suite",
      tag: "MAKE YOURSELF AT HOME",
      price: 2500,
      size: 58,
      cap: 4,
      bed: "King bed + sofa bed",
      desc: "Space for slow mornings and shared moments. A separate living area makes a longer stay feel effortless.",
      amenities: ["Complimentary Wi-Fi", "Breakfast included", "Separate living room", "Bathrobes"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1800&q=85",
          alt: "Spacious hotel suite with king bed and separate lounge",
        },
        {
          url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1800&q=85",
          alt: "Stillmere Suite lounge with sofa and natural light",
        },
        {
          url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1800&q=85",
          alt: "Elegant suite bathroom with freestanding bath",
        },
      ],
    },
  ],
  rules: {
    arrival: "Check-in from 14:00. Check-out by 11:00.",
    smoking: "Stillmere is a non-smoking property.",
    pets: "Pet policy is awaiting confirmation.",
    visitors: "Visitor arrangements are illustrative and awaiting confirmation.",
    occupancy: "Registered guests must not exceed the room’s stated capacity.",
    quiet: "Quiet hours are awaiting confirmation.",
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
let published = storage.get("stillmere-published", clone(defaultContent));
let draft = storage.get("stillmere-draft", null);
let cmsDirty = false;
let previewMode = false;
let busy = false;
let galleryIndex = 0;
const datePlus = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
let state = {
  checkin: datePlus(7),
  checkout: datePlus(9),
  guests: 2,
  room: "classic",
  guest: {},
  payment: "card",
  confirmed: false,
  receipt: null,
};
try {
  state = { ...state, ...JSON.parse(sessionStorage.getItem("stillmere-booking") || "null") };
} catch {}
const saveState = () => sessionStorage.setItem("stillmere-booking", JSON.stringify(state));
const content = () => (previewMode && draft ? draft : published);
const rooms = () => content().rooms;
const room = (id = state.room) => rooms().find((r) => r.id === id) || rooms()[0];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (n) => `R${Number(n).toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;
const nights = (s = state) => Math.max(1, Math.round((new Date(s.checkout) - new Date(s.checkin)) / 86400000));
const fmt = (d) => new Date(`${d}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const deadline = (checkin = state.checkin) => {
  const d = new Date(`${checkin}T12:00:00`);
  d.setDate(d.getDate() - 2);
  return `${d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} at 14:00 SAST`;
};
const imageUrl = (url, width = 1400) => {
  if (!url.includes("images.unsplash.com")) return url;
  return `${url.split("?")[0]}?auto=format&fit=crop&w=${width}&q=84`;
};
const picture = (image, className = "", eager = false) =>
  `<img class="${className}" src="${imageUrl(image.url || image, 1200)}" srcset="${imageUrl(image.url || image, 640)} 640w, ${imageUrl(image.url || image, 1200)} 1200w, ${imageUrl(image.url || image, 1800)} 1800w" sizes="(max-width: 768px) 100vw, 50vw" alt="${esc(image.alt || "")}" width="1200" height="800" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
const toast = (message) => {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 4000);
};
const go = (path) => {
  location.hash = path;
};
const checkoutPath = (path) => ["guest", "review", "confirmation"].includes(path);

function search(home = false, compact = false) {
  return `<form class="search ${home ? "home-search" : ""} ${compact ? "compact-search" : ""}" data-search novalidate>
    <label>Check-in<input name="checkin" type="date" min="${datePlus(0)}" value="${state.checkin}" required></label>
    <label>Check-out<input name="checkout" type="date" min="${state.checkin}" value="${state.checkout}" required></label>
    <label>Guests<select name="guests" aria-label="Number of guests">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${+state.guests === n ? "selected" : ""}>${n} guest${n > 1 ? "s" : ""}</option>`).join("")}</select></label>
    <button type="submit">${compact ? "Book now" : "Check availability"} <span aria-hidden="true">→</span></button>
    <p class="form-message" role="alert"></p>
  </form>`;
}
const included = `<ul class="tick-list"><li>Breakfast included</li><li>Complimentary Wi-Fi</li><li>15% VAT included</li><li>No additional fees</li></ul>`;
function card(r) {
  const total = r.price * nights();
  return `<article class="room-card">
    <a class="card-image" href="#room/${r.id}" aria-label="View ${esc(r.name)}">${picture(r.images[0])}<span class="image-label">Illustrative room image</span></a>
    <div class="card-body"><p class="eyebrow">${esc(r.tag)}</p><h3>${esc(r.name)}</h3>
      <p class="room-meta">${r.size} m² <span>·</span> ${esc(r.bed)} <span>·</span> Up to ${r.cap}</p>
      <p>${esc(r.desc)}</p><div class="amenity-chips">${r.amenities.slice(0, 3).map((a) => `<span>${esc(a)}</span>`).join("")}</div>
      <div class="card-bottom"><div><strong class="price">${money(r.price)}</strong><small> nightly · ${money(total)} for ${nights()} night${nights() > 1 ? "s" : ""}</small></div><a class="button secondary" href="#room/${r.id}">View room</a></div>
    </div></article>`;
}
function home() {
  const p = content().pages;
  return `<section class="immersive-hero" style="--hero:url('${esc(imageUrl(p.heroImage, 2200))}')">
    <div class="hero-content"><p class="eyebrow light-text">WELCOME TO STILLMERE</p><h1>${esc(p.headline)}</h1><p>${esc(p.heroText)}</p><a class="button brass" href="#rooms">Find your room</a></div>
    <span class="image-label hero-label">Illustrative property image</span>
  </section>
  <div id="main-booking" class="booking-dock"><p class="eyebrow">PLAN YOUR STAY</p>${search(true)}</div>
  <section class="benefit-band"><span>Best direct rate</span><span>Breakfast included</span><span>Flexible cancellation</span><span>VAT included</span></section>
  <section class="wrap"><div class="section-head"><div><p class="eyebrow">ROOM HIGHLIGHTS</p><h2>Room to feel at home.</h2></div><p>Compare thoughtful spaces for a quiet night away or a longer escape.</p></div><div class="room-grid">${rooms().map(card).join("")}</div></section>
  <section class="editorial"><div class="editorial-image">${picture({ url: "https://images.unsplash.com/photo-1604145195376-e2c8195adf29?auto=format&fit=crop&w=1800&q=85", alt: "Outdoor hotel dining terrace with wooden tables" })}<span class="image-label">Illustrative dining image</span></div><div><p class="eyebrow">EXPERIENCES</p><h2>Good mornings. Unhurried evenings.</h2><p>${esc(p.dining)}</p><a class="text-link" href="#dining">Explore dining →</a></div></section>
  <section class="navy-section"><div><p class="eyebrow light-text">WHY BOOK DIRECT</p><h2>A little more peace of mind.</h2></div>${included}<a class="button brass" href="#rooms">View available rooms</a></section>
  <section class="wrap info-grid"><div><p class="eyebrow">ARRIVAL</p><h3>Settle in from 14:00</h3><p>Departure is by 11:00. Early arrival is subject to confirmation.</p></div><div><p class="eyebrow">YOUR RATE</p><h3>No surprise fees</h3><p>Breakfast, Wi-Fi and 15% VAT are included in this illustrative direct rate.</p></div><div><p class="eyebrow">NEED TO KNOW</p><h3>Plan with confidence</h3><p>Review accessibility, cancellation and house information before you stay.</p><a class="text-link" href="#house-rules">Read house rules →</a></div></section>`;
}
function listing() {
  return `<section class="page-intro wrap"><p class="eyebrow">YOUR STAY STARTS HERE</p><h1>Find your quiet corner.</h1><p>Every direct rate includes breakfast, Wi-Fi and VAT.</p>${search()}</section>
  <section class="wrap room-results"><div class="filters"><p id="count" aria-live="polite"></p><label>Sort rooms<select id="sort"><option value="price">Price: low to high</option><option value="high">Price: high to low</option><option value="space">Largest first</option></select></label></div><div class="room-grid" id="room-list"></div></section>`;
}
function gallery(r) {
  const image = r.images[galleryIndex] || r.images[0];
  return `<div class="gallery" tabindex="0" aria-label="${esc(r.name)} image gallery. Use left and right arrow keys.">
    <div class="gallery-main">${picture(image, "", true)}<span class="image-label">Illustrative image ${galleryIndex + 1} of ${r.images.length}</span>
      <button class="gallery-arrow prev" aria-label="Previous image">←</button><button class="gallery-arrow next" aria-label="Next image">→</button>
    </div><div class="thumbnails">${r.images.map((img, i) => `<button data-gallery="${i}" class="${i === galleryIndex ? "selected" : ""}" aria-label="Show image ${i + 1}: ${esc(img.alt)}">${picture(img)}</button>`).join("")}</div>
  </div>`;
}
function bookingSummary(data = state, snapshot = null) {
  const r = snapshot?.room || room(data.room);
  const nightCount = snapshot?.nights || nights(data);
  const total = snapshot?.total || r.price * nightCount;
  const payment = snapshot?.payment || data.payment;
  return `<aside class="summary panel"><details class="mobile-summary"><summary>Stay summary · ${money(total)}</summary></details>
    <div class="summary-image">${picture(r.images?.[0] || { url: r.image, alt: `${r.name} room` })}<span class="image-label">Illustrative room image</span></div>
    <h3>${esc(r.name)}</h3><p>${fmt(data.checkin)} — ${fmt(data.checkout)}<br>${nightCount} night${nightCount > 1 ? "s" : ""} · ${data.guests} guest${data.guests > 1 ? "s" : ""}</p>
    ${snapshot ? "" : '<a class="text-link" href="#rooms">Change your stay</a>'}
    <dl class="price-list"><div><dt>${money(r.price)} × ${nightCount} nights</dt><dd>${money(total)}</dd></div><div><dt>Included VAT (15%)</dt><dd>${money((total * 15) / 115)}</dd></div><div><dt>Additional fees</dt><dd>R0</dd></div><div class="grand-total"><dt>Total</dt><dd>${money(total)}</dd></div><div><dt>${payment === "card" ? "Due now" : "Due at hotel"}</dt><dd>${payment === "card" ? money(total) : money(total)}</dd></div><div><dt>${payment === "card" ? "Due at hotel" : "Due now"}</dt><dd>R0</dd></div></dl>
    <p class="policy-note">Breakfast & Wi-Fi included<br>Free cancellation until ${snapshot?.deadline || deadline(data.checkin)}</p>
    <button class="text-button" data-policy>View cancellation and payment terms</button></aside>`;
}
function detail(id) {
  const r = room(id);
  if (!r || !rooms().some((item) => item.id === id)) return listing();
  state.room = id;
  saveState();
  galleryIndex = Math.min(galleryIndex, r.images.length - 1);
  return `<section class="wrap"><a class="back-link" href="#rooms">← All rooms</a><div class="section-head"><div><p class="eyebrow">${esc(r.tag)}</p><h1>${esc(r.name)}</h1></div><span class="pill">Breakfast included</span></div>
    ${gallery(r)}
    <div class="detail-grid"><div><h2>Stay a little longer.</h2><p class="lead">${esc(r.desc)}</p><dl class="specs"><div><dt>Room size</dt><dd>${r.size} m²</dd></div><div><dt>Bed</dt><dd>${esc(r.bed)}</dd></div><div><dt>Capacity</dt><dd>Up to ${r.cap} guests</dd></div></dl>
      <h3>Room amenities</h3><div class="amenities">${r.amenities.map((a) => `<span>${esc(a)}</span>`).join("")}</div>
      <details><summary>Inclusions</summary>${included}</details><details><summary>Cancellation</summary><p>Free cancellation until ${deadline()}. After that, the first night is charged. Illustrative terms.</p></details><details><summary>House rules</summary><p>Check-in from 14:00, check-out by 11:00 and non-smoking. Other policies await confirmation.</p><a class="text-link" href="#house-rules">Read all house rules</a></details>
    </div><div>${bookingSummary()}<button id="book-room" class="button full-button" ${+state.guests > r.cap ? "disabled" : ""}>Choose this room</button>${+state.guests > r.cap ? '<p class="form-message error">This room cannot accommodate your party. Change your search or choose another room.</p>' : ""}</div></div></section>`;
}
const steps = (active) => `<ol class="steps" aria-label="Booking progress">${["Choose room", "Guest & payment", "Review", "Confirmation"].map((s, i) => `<li class="${i === active ? "current" : i < active ? "complete" : ""}"><span>${i + 1}</span>${s}</li>`).join("")}</ol>`;
function guest() {
  return `<section class="wrap checkout">${steps(1)}<p class="eyebrow">LET’S MAKE IT YOURS</p><h1>Guest & payment.</h1><div class="checkout-grid"><form class="panel" id="guest-form" novalidate><h2>Your details</h2><p>Tell us who we’ll be welcoming.</p><div class="fields">
    <label class="full">Full name<input name="name" autocomplete="name" required minlength="2" value="${esc(state.guest.name)}"><span class="field-error"></span></label>
    <label>Email address<input name="email" type="email" autocomplete="email" required value="${esc(state.guest.email)}"><span class="field-error"></span></label>
    <label>Mobile number<input name="phone" type="tel" autocomplete="tel" required pattern="[+0-9 ()-]{7,20}" value="${esc(state.guest.phone)}"><span class="field-error"></span></label>
    <label class="full">Special requests <small>(optional)</small><textarea name="requests" rows="3" maxlength="500">${esc(state.guest.requests)}</textarea></label></div>
    <h2>Payment method</h2><p class="demo-note"><strong>Demo payment only.</strong> No payment is collected. Do not enter real card details.</p>
    <fieldset><legend>Choose how to pay</legend><label class="choice"><input type="radio" name="payment" value="card" ${state.payment === "card" ? "checked" : ""}><span><strong>Test card ···· 4242</strong><small>${money(room().price * nights())} due now · R0 at hotel</small></span></label><label class="choice"><input type="radio" name="payment" value="hotel" ${state.payment === "hotel" ? "checked" : ""}><span><strong>Pay at hotel (demo)</strong><small>R0 due now · ${money(room().price * nights())} at hotel</small></span></label></fieldset>
    <label class="check"><input type="checkbox" required name="terms" ${state.guest.terms ? "checked" : ""}><span>I agree to the <button type="button" class="text-button" data-policy>booking, payment and cancellation terms</button>.</span></label><a class="text-link" href="#house-rules">Read the hotel house rules</a>
    <p class="form-message" role="alert"></p><div class="actions"><a class="button secondary" href="#room/${state.room}">← Back</a><button type="submit">Review booking →</button></div></form>${bookingSummary()}</div></section>`;
}
function review() {
  return `<section class="wrap checkout">${steps(2)}<p class="eyebrow">ONE LAST LOOK</p><h1>Your stay, at a glance.</h1><div class="checkout-grid"><div class="panel"><h2>Guest details</h2><div class="row"><p><strong>${esc(state.guest.name)}</strong><br>${esc(state.guest.email)}<br>${esc(state.guest.phone)}</p><a class="text-link" href="#guest">Edit</a></div><hr><div class="row"><div><strong>Payment</strong><p>${state.payment === "card" ? `Demo card · ${money(room().price * nights())} due now` : `Pay at hotel · ${money(room().price * nights())} due on arrival`}</p></div><a class="text-link" href="#guest">Edit</a></div>${state.guest.requests ? `<hr><strong>Special requests</strong><p>${esc(state.guest.requests)}</p>` : ""}<p class="demo-note">This creates a demonstration booking only. No room is reserved and no payment or email is sent.</p><p class="form-message" role="alert"></p><div class="actions"><a class="button secondary" href="#guest">← Back</a><button id="confirm">Confirm demo booking →</button></div></div>${bookingSummary()}</div></section>`;
}
function confirmation() {
  const s = state.receipt;
  return `<section class="wrap checkout receipt-page">${steps(3)}<article class="receipt"><div class="receipt-heading"><div><p class="eyebrow">DEMO RESERVATION CONFIRMED</p><h1>Your stay is all set.</h1><p>No real reservation, email or payment has been made.</p></div><div class="reference"><small>BOOKING REFERENCE</small><strong>${esc(s.reference)}</strong></div></div>
    <div class="receipt-grid"><div><h2>Guest</h2><p>${esc(s.guest.name)}<br>${esc(s.guest.email)}<br>${esc(s.guest.phone)}</p><h2>Arrival & departure</h2><p>Check-in from 14:00 on ${fmt(s.checkin)}<br>Check-out by 11:00 on ${fmt(s.checkout)}</p><p class="policy-note">Free cancellation until ${s.deadline}. After that, the first night is charged.</p></div>${bookingSummary(s, s)}</div>
    <footer class="receipt-footer"><p>Receipt created ${fmt(s.created.slice(0, 10))} · Content frozen at confirmation</p><div class="actions"><button id="print" class="secondary">Print / Save PDF</button><button id="new-stay">Plan another stay</button></div></footer></article></section>`;
}
function houseRules() {
  const r = content().rules;
  const groups = [["Arrival & departure", r.arrival, true], ["Smoking", r.smoking, true], ["Pets", r.pets], ["Visitors", r.visitors], ["Occupancy", r.occupancy], ["Quiet hours", r.quiet]];
  return `<section class="page-intro wrap"><p class="eyebrow">BEFORE YOU ARRIVE</p><h1>House rules.</h1><p>Clear, considered guidance for a comfortable stay. Only check-in, check-out and non-smoking details are currently agreed for this concept.</p></section><section class="wrap rules-grid">${groups.map(([title, text, confirmed]) => `<article class="panel"><p class="eyebrow">${confirmed ? "ILLUSTRATIVE" : "AWAITING CONFIRMATION"}</p><h2>${title}</h2><p>${esc(text)}</p></article>`).join("")}</section><section class="wrap terms-panel"><h2>Cancellation & payment</h2><p>Cancel free until 14:00 SAST two days before check-in. After that, the first night is charged. Card and pay-at-hotel selections are simulations only. Final hotel terms remain subject to confirmation.</p><button class="text-button" data-policy>Open booking terms</button></section>`;
}
function info(page) {
  const p = content().pages;
  if (page === "dining") return `<section class="feature-hero">${picture({ url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=85", alt: "Warm restaurant dining room set for evening service" }, "", true)}<span class="image-label">Illustrative dining image</span><div><p class="eyebrow light-text">AT OUR TABLE</p><h1>Good mornings.<br>Great company.</h1></div></section><section class="wrap"><p class="lead">${esc(p.dining)}</p><div class="info-grid"><div><p class="eyebrow">07:00 — 10:00</p><h3>Breakfast, on us.</h3><p>Seasonal fruit, warm pastries and cooked favourites. Included with every direct booking.</p></div><div><p class="eyebrow">MIDDAY</p><h3>A leisurely lunch.</h3><p>Dining hours and menus are illustrative and await confirmation.</p></div><div><p class="eyebrow">EVENING</p><h3>Time together.</h3><p>Thoughtfully prepared dishes in a relaxed setting. Details are illustrative.</p></div></div></section>`;
  if (page === "hotel") return `<section class="page-intro wrap"><p class="eyebrow">A WARMER WELCOME</p><h1>Considered comfort.<br>Uncomplicated hospitality.</h1></section><section class="editorial"><div class="editorial-image">${picture({ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=85", alt: "Peaceful hotel terrace surrounded by gardens" })}<span class="image-label">Illustrative property image</span></div><div><p class="eyebrow">OUR HOTEL</p><h2>A place of your own.</h2><p>${esc(p.hotel)}</p><a class="button" href="#rooms">Discover your room</a></div></section><section class="wrap info-grid"><div><h3>Daily breakfast</h3><p>Included when booking direct.</p></div><div><h3>Complimentary Wi-Fi</h3><p>Available throughout this illustrative property.</p></div><div><h3>Thoughtful service</h3><p>Property address and facilities await confirmation.</p></div></section>`;
  return `<section class="page-intro wrap"><p class="eyebrow">WE’RE HERE TO HELP</p><h1>Let’s talk about your stay.</h1></section><section class="wrap contact-grid"><form id="contact-form" class="panel" novalidate><div class="fields"><label>Your name<input name="name" required><span class="field-error"></span></label><label>Email address<input name="email" type="email" required><span class="field-error"></span></label><label class="full">Topic<select name="topic"><option>Planning a stay</option><option>Dining enquiry</option><option>Accessibility</option><option>Something else</option></select></label><label class="full">Message<textarea name="message" required rows="5"></textarea><span class="field-error"></span></label></div><p class="demo-note">Demo form only. Your message will not be sent.</p><button type="submit">Submit demo enquiry</button><p class="form-message" role="status"></p></form><div><h2>A personal touch.</h2><p>Whether it’s a special request, a dining question or a larger party, we’d love to help you plan it.</p><p><strong>Check-in</strong> · From 14:00<br><strong>Check-out</strong> · By 11:00</p><p>Property address, email and telephone are awaiting confirmation.</p></div></section>`;
}

function cmsShell(tab = "pages") {
  const data = draft || clone(published);
  const status = cmsDirty ? "Unsaved changes" : draft ? "Draft saved locally" : "Published data";
  const nav = [["pages", "Pages"], ["rooms", "Rooms"], ["media", "Media"], ["rules", "House Rules"], ["publish", "Preview & Publish"]];
  let body = "";
  if (tab === "pages") body = `<h1>Pages</h1><p>Edit guest-facing homepage, dining and hotel information.</p><form class="cms-form" data-cms-form="pages"><label>Homepage headline<input name="headline" required value="${esc(data.pages.headline)}"></label><label>Homepage supporting text<textarea name="heroText" required rows="3">${esc(data.pages.heroText)}</textarea></label><label>Hero image URL<input name="heroImage" type="url" required value="${esc(data.pages.heroImage)}"></label><label>Hero image alt text<input name="heroAlt" required value="${esc(data.pages.heroAlt)}"></label><label>Dining information<textarea name="dining" required rows="4">${esc(data.pages.dining)}</textarea></label><label>Hotel information<textarea name="hotel" required rows="4">${esc(data.pages.hotel)}</textarea></label></form>`;
  if (tab === "rooms") body = `<h1>Rooms</h1><p>Required values are validated before a draft can be saved.</p><form class="cms-form" data-cms-form="rooms">${data.rooms.map((r, i) => `<fieldset><legend>${esc(r.name)}</legend><input type="hidden" name="id-${i}" value="${r.id}"><label>Name<input name="name-${i}" required value="${esc(r.name)}"></label><label>Description<textarea name="desc-${i}" required>${esc(r.desc)}</textarea></label><div class="fields"><label>Price (ZAR)<input name="price-${i}" type="number" min="1" required value="${r.price}"></label><label>Capacity<input name="cap-${i}" type="number" min="1" required value="${r.cap}"></label><label>Size (m²)<input name="size-${i}" type="number" min="1" required value="${r.size}"></label><label>Bed<input name="bed-${i}" required value="${esc(r.bed)}"></label></div><label>Amenities (comma separated)<input name="amenities-${i}" required value="${esc(r.amenities.join(", "))}"></label><label>Primary photo URL<input name="image-${i}" type="url" required value="${esc(r.images[0].url)}"></label><label>Primary photo alt text<input name="alt-${i}" required value="${esc(r.images[0].alt)}"></label></fieldset>`).join("")}</form>`;
  if (tab === "media") body = `<h1>Media</h1><p>Browse and replace room images. All guest-facing media requires descriptive alt text.</p><form class="cms-form media-cms" data-cms-form="media">${data.rooms.flatMap((r, ri) => r.images.map((img, ii) => `<fieldset><legend>${esc(r.name)} · Image ${ii + 1}</legend>${picture(img)}<label>Image URL<input type="url" required name="url-${ri}-${ii}" value="${esc(img.url)}"></label><label>Alt text<input required name="alt-${ri}-${ii}" value="${esc(img.alt)}"></label></fieldset>`)).join("")}</form>`;
  if (tab === "rules") body = `<h1>House Rules</h1><p>One shared source used in room details, checkout and the guest house-rules page.</p><form class="cms-form" data-cms-form="rules">${Object.entries(data.rules).map(([key, value]) => `<label>${key[0].toUpperCase() + key.slice(1)}<textarea name="${key}" required rows="3">${esc(value)}</textarea></label>`).join("")}</form>`;
  if (tab === "publish") body = `<h1>Preview & Publish</h1><p>Drafts remain private to this browser until you explicitly publish them to the local guest demo.</p><div class="publish-card"><div><strong>Published guest version</strong><p>Visible on normal guest pages in this browser.</p></div><span class="status published">Published</span></div><div class="publish-card"><div><strong>Staff draft</strong><p>${draft ? "A saved local draft is ready to preview or publish." : "No separate draft has been saved."}</p></div><span class="status ${draft ? "draft" : ""}">${draft ? "Draft saved" : "No draft"}</span></div><div class="actions"><button id="preview-draft" class="secondary" ${draft ? "" : "disabled"}>Preview actual guest layout</button><button id="publish-draft" ${draft ? "" : "disabled"}>Publish to local guest demo</button></div><p class="demo-note"><strong>Local demo behavior only.</strong> Publishing here writes to this browser’s local storage. It does not deploy publicly or use Figma Publish.</p>`;
  return `<section class="cms"><aside class="cms-sidebar"><a class="brand light" href="#home">STILLMERE<small>STAFF DEMO</small></a><p class="local-label">Local access · No production authentication</p><nav aria-label="Staff sections">${nav.map(([id, label]) => `<a class="${tab === id ? "active" : ""}" href="#staff/${id}">${label}</a>`).join("")}</nav><a href="#home">← Guest website</a></aside><div class="cms-main"><div class="cms-top"><span id="cms-status" class="status ${cmsDirty ? "dirty" : draft ? "draft" : "published"}">${status}</span>${tab !== "publish" ? '<button id="save-draft">Save Draft</button>' : ""}</div>${body}<p class="form-message" role="alert"></p></div></section>`;
}
function noResults() {
  return `<div class="no-results" tabindex="-1" id="no-results"><p class="eyebrow">NO MATCHING ROOM</p><h2>We don’t have an online room for this party size.</h2><p>Our largest listed room sleeps four. Change the guest count or contact us and we’ll help with options.</p><div class="actions"><button id="change-search" class="secondary">Change search</button><button id="reset-search" class="secondary">Reset to 2 guests</button><a class="button" href="#contact">Contact the hotel</a></div></div>`;
}
function previewBanner() {
  return previewMode ? `<div class="preview-banner"><strong>Draft preview</strong><span>Only staff can see these unpublished changes.</span><a class="button secondary" href="#staff/publish">Return to CMS</a></div>` : "";
}
function render() {
  const path = location.hash.slice(1) || "home";
  if (path.startsWith("staff")) previewMode = false;
  if (["guest", "review"].includes(path) && +state.guests > room().cap) return go("rooms");
  if (path === "review" && !state.guest.name) return go("guest");
  if (path === "confirmation" && (!state.confirmed || !state.receipt)) return go("rooms");
  const route = path === "home" ? home() : path === "rooms" ? listing() : path.startsWith("room/") ? detail(path.split("/")[1]) : path === "guest" ? guest() : path === "review" ? review() : path === "confirmation" ? confirmation() : path === "house-rules" ? houseRules() : ["hotel", "dining", "contact"].includes(path) ? info(path) : path.startsWith("staff") ? cmsShell(path.split("/")[1] || "pages") : home();
  app.innerHTML = previewBanner() + route;
  document.body.classList.toggle("cms-view", path.startsWith("staff"));
  document.body.classList.toggle("checkout-view", checkoutPath(path));
  $$("header nav a").forEach((a) => a.classList.toggle("active", a.hash === `#${path}`));
  $("header nav").classList.remove("open");
  $(".menu").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
  bind(path);
  updatePersistent(path);
}

function validateForm(form) {
  let valid = true;
  $$("input, textarea, select", form).forEach((field) => {
    const error = field.parentElement.querySelector(".field-error");
    if (error) error.textContent = "";
    let validUrl = true;
    if (field.type === "url" && field.value) {
      try {
        validUrl = ["http:", "https:"].includes(new URL(field.value).protocol);
      } catch {
        validUrl = false;
      }
      field.setCustomValidity(validUrl ? "" : "Enter a complete http or https image URL.");
    }
    if (!field.checkValidity()) {
      valid = false;
      field.setAttribute("aria-invalid", "true");
      if (error) error.textContent = field.validationMessage;
    } else field.removeAttribute("aria-invalid");
  });
  if (!valid) form.querySelector(":invalid")?.focus();
  return valid;
}
function persistSearchEdits(form) {
  const data = new FormData(form);
  state.checkin = data.get("checkin");
  state.checkout = data.get("checkout");
  state.guests = +data.get("guests");
  state.confirmed = false;
  saveState();
}
function bindSearch(form) {
  const message = $(".form-message", form);
  form.oninput = () => {
    const checkin = form.elements.checkin.value;
    form.elements.checkout.min = checkin;
    persistSearchEdits(form);
    $$("[data-search]").filter((f) => f !== form).forEach((f) => {
      if (f.elements.checkin) {
        f.elements.checkin.value = state.checkin;
        f.elements.checkout.value = state.checkout;
        f.elements.guests.value = state.guests;
      }
    });
  };
  form.onsubmit = (event) => {
    event.preventDefault();
    if (busy) return;
    persistSearchEdits(form);
    if (!state.checkin || !state.checkout || state.checkout <= state.checkin) {
      message.textContent = "Choose a check-out date after your check-in date.";
      form.elements.checkout.focus();
      return;
    }
    if (nights() > 30) {
      message.textContent = "For stays longer than 30 nights, please contact us.";
      return;
    }
    busy = true;
    const button = $("button[type=submit]", form);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Checking rooms…";
    message.className = "form-message busy-message";
    message.textContent = "Checking illustrative availability for your dates.";
    requestAnimationFrame(() => {
      busy = false;
      if (location.hash === "#rooms") render();
      else go("rooms");
      toast("Availability updated for your selected stay.");
    });
  };
}
function updatePersistent(path) {
  const holder = $("#persistent-booking");
  holder.innerHTML = "";
  if (checkoutPath(path) || path.startsWith("staff")) return;
  holder.innerHTML = `<div class="desktop-sticky">${search(false, true)}</div><a class="mobile-bookbar" href="#rooms"><span><small>${fmt(state.checkin)} · ${nights()} night${nights() > 1 ? "s" : ""}</small><strong>${state.guests} guest${state.guests > 1 ? "s" : ""}</strong></span><b>Book now</b></a>`;
  $$("[data-search]", holder).forEach(bindSearch);
  const anchor = $("#main-booking");
  if (anchor && "IntersectionObserver" in window) {
    const sticky = $(".desktop-sticky", holder);
    sticky.hidden = true;
    const observer = new IntersectionObserver(([entry]) => (sticky.hidden = entry.isIntersecting), { threshold: 0 });
    observer.observe(anchor);
  }
}
function saveCmsDraft(tab) {
  const form = $("[data-cms-form]");
  if (!form || !validateForm(form)) {
    $(".cms-main > .form-message").textContent = "Fix the highlighted required fields before saving.";
    return;
  }
  const data = draft ? clone(draft) : clone(published);
  const f = new FormData(form);
  if (tab === "pages") ["headline", "heroText", "heroImage", "heroAlt", "dining", "hotel"].forEach((k) => (data.pages[k] = f.get(k).trim()));
  if (tab === "rules") Object.keys(data.rules).forEach((k) => (data.rules[k] = f.get(k).trim()));
  if (tab === "rooms") data.rooms.forEach((r, i) => {
    r.name = f.get(`name-${i}`).trim(); r.desc = f.get(`desc-${i}`).trim(); r.price = +f.get(`price-${i}`); r.cap = +f.get(`cap-${i}`); r.size = +f.get(`size-${i}`); r.bed = f.get(`bed-${i}`).trim(); r.amenities = f.get(`amenities-${i}`).split(",").map((x) => x.trim()).filter(Boolean); r.images[0].url = f.get(`image-${i}`).trim(); r.images[0].alt = f.get(`alt-${i}`).trim();
  });
  if (tab === "media") data.rooms.forEach((r, ri) => r.images.forEach((img, ii) => { img.url = f.get(`url-${ri}-${ii}`).trim(); img.alt = f.get(`alt-${ri}-${ii}`).trim(); }));
  draft = data;
  storage.set("stillmere-draft", draft);
  cmsDirty = false;
  $("#cms-status").textContent = "Draft saved locally";
  $("#cms-status").className = "status draft";
  $(".cms-main > .form-message").className = "form-message success-message";
  $(".cms-main > .form-message").textContent = "Draft saved. Published guest pages are unchanged.";
}
function bind(path) {
  $$("[data-policy]").forEach((button) => (button.onclick = () => $("#policy").showModal()));
  $$("[data-search]").forEach(bindSearch);
  if ($("#room-list")) {
    const update = () => {
      const list = rooms().filter((r) => r.cap >= +state.guests);
      const sort = $("#sort").value;
      list.sort((a, b) => (sort === "high" ? b.price - a.price : sort === "space" ? b.size - a.size : a.price - b.price));
      $("#room-list").innerHTML = list.length ? list.map(card).join("") : noResults();
      $("#count").textContent = `${list.length} room${list.length === 1 ? "" : "s"} for ${state.guests} guests · ${nights()} nights`;
      $("#reset-search")?.addEventListener("click", () => { state.guests = 2; saveState(); render(); });
      $("#change-search")?.addEventListener("click", () => $(".page-intro [name=guests]").focus());
    };
    $("#sort").onchange = update;
    update();
  }
  if ($(".gallery")) {
    const change = (index) => { galleryIndex = (index + room().images.length) % room().images.length; render(); };
    $(".prev").onclick = () => change(galleryIndex - 1);
    $(".next").onclick = () => change(galleryIndex + 1);
    $$("[data-gallery]").forEach((b) => (b.onclick = () => change(+b.dataset.gallery)));
    $(".gallery").onkeydown = (e) => { if (e.key === "ArrowLeft") change(galleryIndex - 1); if (e.key === "ArrowRight") change(galleryIndex + 1); };
  }
  $("#book-room")?.addEventListener("click", () => go("guest"));
  if ($("#guest-form")) {
    const form = $("#guest-form");
    const sync = () => {
      const f = new FormData(form);
      state.guest = { name: f.get("name"), email: f.get("email"), phone: f.get("phone"), requests: f.get("requests"), terms: f.get("terms") === "on" };
      state.payment = f.get("payment") || "card";
      saveState();
    };
    form.oninput = sync;
    form.onsubmit = (e) => { e.preventDefault(); sync(); if (!validateForm(form)) { $(".form-message", form).textContent = "Please complete the highlighted details."; return; } go("review"); };
  }
  $("#confirm")?.addEventListener("click", (e) => {
    if (busy) return;
    busy = true;
    e.currentTarget.disabled = true;
    e.currentTarget.setAttribute("aria-busy", "true");
    e.currentTarget.textContent = "Confirming…";
    $(".form-message").textContent = "Creating your demonstration booking securely.";
    requestAnimationFrame(() => {
      const r = clone(room());
      state.confirmed = true;
      state.receipt = { reference: `SM-${Date.now().toString(36).toUpperCase()}`, created: new Date().toISOString(), checkin: state.checkin, checkout: state.checkout, guests: state.guests, nights: nights(), guest: clone(state.guest), payment: state.payment, room: r, total: r.price * nights(), deadline: deadline() };
      saveState(); busy = false; go("confirmation");
    });
  });
  $("#print")?.addEventListener("click", () => window.print());
  $("#new-stay")?.addEventListener("click", () => { state.confirmed = false; state.receipt = null; saveState(); go("rooms"); });
  if ($("#contact-form")) $("#contact-form").onsubmit = (e) => { e.preventDefault(); if (!validateForm(e.currentTarget)) return; $(".form-message", e.currentTarget).className = "form-message success-message"; $(".form-message", e.currentTarget).textContent = "Demo enquiry completed. No message was sent."; };
  const cmsForm = $("[data-cms-form]");
  if (cmsForm) cmsForm.oninput = () => { cmsDirty = true; $("#cms-status").textContent = "Unsaved changes"; $("#cms-status").className = "status dirty"; };
  $("#save-draft")?.addEventListener("click", () => saveCmsDraft(path.split("/")[1] || "pages"));
  $("#preview-draft")?.addEventListener("click", () => { previewMode = true; go("home"); });
  $("#publish-draft")?.addEventListener("click", () => {
    if (!draft) return;
    published = clone(draft); storage.set("stillmere-published", published); localStorage.removeItem("stillmere-draft"); draft = null; previewMode = false; toast("Draft published to the local guest demo."); render();
  });
}

$(".menu").onclick = () => {
  const open = $("header nav").classList.toggle("open");
  $(".menu").setAttribute("aria-expanded", String(open));
};
window.addEventListener("hashchange", render);
render();
