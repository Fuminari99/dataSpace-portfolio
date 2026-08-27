// place js in here

window.onload = () => {

  let all = document.getElementsByClassName("zoom");
  let lightbox = document.getElementById("lightbox");

  if (all.length > 0) {
    for (let i of all) {
      i.onclick = () => {
        let clone = i.cloneNode();
        clone.className = "";
        lightbox.innerHTML = "";
        lightbox.appendChild(clone);
        lightbox.className = "show";
      };
    }
  }

  lightbox.onclick = () => {
    lightbox.className = "";
  };
};


document.addEventListener("DOMContentLoaded", function () {
  var lazyVideos = [].slice.call(document.querySelectorAll("video.lazy"));

  if ("IntersectionObserver" in window) {
    var lazyVideoObserver = new IntersectionObserver(function (
      entries,
      observer
    ) {
      entries.forEach(function (video) {
        if (video.isIntersecting) {
          for (var source in video.target.children) {
            var videoSource = video.target.children[source];
            if (
              typeof videoSource.tagName === "string" &&
              videoSource.tagName === "SOURCE"
            ) {
              videoSource.src = videoSource.dataset.src;
            }
          }

          video.target.load();
          video.target.classList.remove("lazy");
          lazyVideoObserver.unobserve(video.target);
        }
      });
    });

    lazyVideos.forEach(function (lazyVideo) {
      lazyVideoObserver.observe(lazyVideo);
    });
  }
});

function scrollToTop() {
  window.scroll({ top: 0, left: 0, behavior: 'smooth' });
}



/* provide parent div id and class name
 * call function from html document when needed.
 */
function dragImages(theContainer, theClassName) {
  let listOfImages = document.getElementsByClassName(theClassName);
  let n = 0;
  for (const el of listOfImages) {
    let w = window.innerWidth;
    let h = window.innerHeight;

    let iw = Math.round(window.innerWidth * 0.3);
    iw = iw < 400 ? 200 : iw;

    let nx = Math.round(getRandomFromRange(-1, 1) * w/2);
    let ny = Math.round(getRandomFromRange(-1, 1) * h/4);
    let x = w / 2 - iw / 2 + nx;
    let y = h / 2 - iw / 2 + ny;

    let s = `"${x}px"`;
    el.style.position = "absolute";
    el.style.width = iw + "px";
    el.style.top = y + "px";
    el.style.left = x + "px";
    el.id = "random-image-" + n++;
  }

  let container = document.querySelector("#" + theContainer);
  console.log(theContainer, container);

  container.addEventListener("touchstart", dragStart, false);
  container.addEventListener("touchend", dragEnd, false);
  container.addEventListener("touchmove", drag, false);

  container.addEventListener("mousedown", dragStart, false);
  container.addEventListener("mouseup", dragEnd, false);
  container.addEventListener("mousemove", drag, false);

  let active = false;
  let origin = {};

  function dragStart(e) {
    if (e.target.classList.value.includes("drag-me")) {
      dragItem = e.target.id;

      if (!(dragItem in origin)) {
        origin[dragItem] = { x: 0, y: 0, cx: 0, cy: 0, ox: 0, oy: 0 };
      }

      let o = origin[dragItem];
      let b = e.type === "touchstart";

      o.x = b ? e.touches[0].clientX - o.ox : e.clientX - o.ox;
      o.y = b ? e.touches[0].clientY - o.oy : e.clientY - o.oy;

      active = true;
    }
  }

  function dragEnd(e) {
    let o = origin[dragItem];
    o.x = o.cx;
    o.y = o.cy;
    active = false;
  }

  function drag(e) {
    if (active) {
      e.preventDefault();
      let o = origin[dragItem];
      let b = e.type === "touchmove";

      o.cx = b ? e.touches[0].clientX - o.x : e.clientX - o.x;
      o.cy = b ? e.touches[0].clientY - o.y : e.clientY - o.y;

      o.ox = o.cx;
      o.oy = o.cy;

      document.querySelector("#" + dragItem).style.transform =
        "translate3d(" + o.ox + "px, " + o.oy + "px, 0)";
    }
  }
}
/* Helper function to generate random numbers within a specified range */
function getRandomFromRange(min, max) {
  return Math.random() * (max - min) + min;
}




document.addEventListener("keydown", function (e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return;
  const o = document.getElementById("go-prev").href
    , s = document.getElementById("go-next").href;
  if (e.key == "ArrowLeft")
    window.location.assign(o);
  else if (e.key == "ArrowRight")
    window.location.assign(s);
  else if (e.key == "Escape") {
    const t = document.getElementById("experiments-overview");
    t.classList.toggle("expanded"),
      t.classList.toggle("collapsed")
  }
});


function initHamburgerMenu() {
  /* initialise Hamburger-Menu */
  const hamburger = document.querySelector(".main__nav-ham");
  const navMenu = document.querySelector(".main__nav-list");
  const title = document.querySelector(".main__nav-title");
  let mobileOpenState = false;

  hamburger.addEventListener("click", mobileMenu);

  function mobileMenu() {

    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");

    mobileOpenState = !mobileOpenState;
    if (mobileOpenState) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }

  function closeMenu() {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  }
}

initHamburgerMenu();
