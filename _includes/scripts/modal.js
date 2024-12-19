function handle_modal(){

    const modal = document.getElementById('modal');
    const the_container = modal.querySelector('.modal__container');
    const close_control = document.getElementById('close-modal-control');
    const the_body = document.querySelector('body');
    const iframe_url = modal.dataset.i_frame;
    const the_iframe = modal.querySelector('iframe');
    
    function open_modal(){

        the_iframe.src = iframe_url;

        the_body.classList.add('no-scroll');

        modal.classList.remove('z_-10');
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-1');

        the_container.classList.add('translate-y-0');
    }
    
    function close_modal(){

        the_iframe.src = '';
        
        the_body.classList.remove('no-scroll');

        the_container.classList.remove('translate-y-0');

        modal.classList.remove('opacity-1');
        modal.classList.add('opacity-0');
        modal.classList.add('z_-10');
    }

    close_control.addEventListener('click', close_modal);

    document.addEventListener('click', function(e){
        if(e.target.id === 'modal'){
            close_modal();
        }
    });

    window.addEventListener('keydown', keyPress);
    
    function keyPress (e) {
        if(e.key === "Escape") {
            close_modal();
        }
    }

    document.querySelectorAll('[data-open-modal]').forEach(function(el){
        el.addEventListener('click', function(e){
            e.preventDefault();
            open_modal();
        });
    });

}

handle_modal()