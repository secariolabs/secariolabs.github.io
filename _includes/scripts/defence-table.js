function handle_defence_table(){

    const nav_buttons = document.querySelectorAll('.defence__levels-table-nav-btn');
    const the_table = document.querySelector('.defence__levels-table');
    const the_table_width = the_table.offsetWidth;

    function handle_nav(e){
        
        const $this = e.currentTarget;
        const target = $this.dataset.target;
        const col = document.querySelector(`[data-col="${target}"]`);

        col.scrollIntoView({
            inline: "end",
            block: "nearest",
            behavior: "smooth",
        });

        deactivate_button(target);

    }

    nav_buttons.forEach(function(btn){
        btn.addEventListener('click', handle_nav);
    });

    function deactivate_button(button_pos){
        nav_buttons.forEach(function(el){
            el.classList.remove('defence__levels-table-nav-btn--inactive');
        });
        document.querySelector(`[data-target="${button_pos}"]`).classList.add('defence__levels-table-nav-btn--inactive');
    }

    function activate_button(button_pos){
        nav_buttons.forEach(function(el){
            el.classList.add('defence__levels-table-nav-btn--inactive');
        });
        document.querySelector(`[data-target="${button_pos}"]`).classList.remove('defence__levels-table-nav-btn--inactive');
    }

    function handle_table_scroll(e) {
        $this = e.currentTarget;
        const scroll_position_left = $this.scrollLeft;
    
        if (scroll_position_left === 0) {
            deactivate_button(1);
        }
        
        if(scroll_position_left >= (the_table_width / 2)){
            deactivate_button(2);
        }

    }

    the_table.addEventListener('scroll', handle_table_scroll);

}

handle_defence_table();