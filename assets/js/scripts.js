const the_header = document.getElementById('site-header');

function handle_menu_on_scroll(){
    let lastKnownScrollPosition = 0;
    let ticking = false;

    function handle_scroll(scrollPos) {
        if(scrollPos > 0) {
            the_header.classList.add('site-header--dark');
        } else {
            the_header.classList.remove('site-header--dark');
        }
    }

    document.addEventListener("scroll", (event) => {
        lastKnownScrollPosition = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                handle_scroll(lastKnownScrollPosition);
                ticking = false;
            });

            ticking = true;
        }
    });

}

window.onload = function(){
    if(window.scrollY > 0 && document.getElementById('site-header')){
        document.getElementById('site-header').classList.add('site-header--dark');
    }
};

function handle_mobile_menu() {
    const menu_btn = document.getElementById('menu-btn');
    const the_nav = document.getElementById('nav');
    menu_btn.addEventListener('click', () => {
        the_nav.slideToggle();
        menu_btn.classList.toggle('active');
    });
}

function handle_banner() {
    const banner = document.getElementById('banner');
    const btn = document.getElementById('close-banner');

    btn.addEventListener('click', function(){
        banner.classList.add('opacity-0');
        banner.addEventListener('transitionend', function(){
            banner.classList.add('hidden');
        }, {
            capture: false,
            once: true,
            passive: false
        });
    });
}

if(the_header){
    handle_menu_on_scroll();
}
handle_mobile_menu();
handle_banner();
