function handle_lightbox(figure_elements, element_type){

    const lightbox = document.getElementById('lightbox');
    const lightbox_img = lightbox.querySelector('img');
    const lightbox_caption = lightbox.querySelector('figcaption');
    const figures = document.querySelectorAll(figure_elements);
    const the_figure = document.getElementById('lightbox-figure');
    const close_control = document.getElementById('close-lightbox-control');
    const the_body = document.querySelector('body');

    let the_img;
    let the_caption = '';
    
    function open_figure(e){
        const $this = e.currentTarget;

        if(element_type === 'figure'){
            the_img = $this.querySelector('img');
            if($this.querySelector('figcaption')){
                the_caption = $this.querySelector('figcaption').innerHTML;
                lightbox_caption.classList.add('py-0_5rem');
                lightbox_caption.classList.add('px-1rem');
            } else {
                the_caption = '';
            }

        } else if(element_type === 'img'){
            the_img = $this;
        }

        const the_src = the_img.src;

        the_body.classList.add('no-scroll');

        lightbox_img.src = the_src;
        lightbox_caption.innerHTML = the_caption;

        lightbox.classList.remove('z_-10');
        lightbox.classList.remove('opacity-0');
        lightbox.classList.add('opacity-1');

        the_figure.classList.add('translate-y-0');
    }
    
    function close_figure(){
        lightbox_img.src = '';
        lightbox_caption.innerHTML = '';

        the_body.classList.remove('no-scroll');

        lightbox_caption.classList.remove('py-0_5rem');
        lightbox_caption.classList.remove('px-1rem');

        the_figure.classList.remove('translate-y-0');

        lightbox.classList.remove('opacity-1');
        lightbox.classList.add('opacity-0');
        lightbox.classList.add('z_-10');
    }

    figures.forEach(function(el){
        el.addEventListener('click', open_figure);
    });

    close_control.addEventListener('click', close_figure);

    document.addEventListener('click', function(e){
        if(e.target.id === 'lightbox'){
            close_figure();
        }
    });

    window.addEventListener('keydown', keyPress);
    
    function keyPress (e) {
        if(e.key === "Escape") {
            close_figure();
        }
    }

}