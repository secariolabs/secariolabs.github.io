function handle_inner_nav(){

    function scrollToElement(element, the_offset) {
        if (!element) {
            console.error('Element not found!');
            return;
        }
            
        /* Calculate the element's distance from the top of the page */
        const elementTop = element.getBoundingClientRect().top + window.scrollY;
    
        /* Scroll the window to position the element 50px from the top */
        window.scrollTo({
            top: elementTop - the_offset, /* Adjust to make the element ${the_offset}px from the top */
            left: 0,
            behavior: 'smooth' /* Optional smooth scrolling */
        });
    }

    const the_nav = document.getElementById('site-nav');
    const the_banner = document.getElementById('banner');
    let nav_height = the_nav.offsetHeight;
    let banner_height = 0;
    
    if(!the_banner.classList.contains('hidden')) {
      banner_height = the_banner.offsetHeight;  
    }

    const the_offset = nav_height + banner_height;

    const the_anchors = document.querySelectorAll('.defence__anchors-item');

    function handle_anchors(e){
        e.preventDefault();
        const $this = e.currentTarget;
        const the_target = $this.dataset.target;
        const the_target_element = document.getElementById(the_target);

        scrollToElement(the_target_element, the_offset);
        
    }

    the_anchors.forEach(function(anchor){
        anchor.addEventListener('click', handle_anchors)
    });
    
}

handle_inner_nav();