function handle_form_behavior(){

    const pristineConfig = {
        /* class of the parent element where the error/success class is added */
        classTo: 'contact__form-control',
        errorClass: 'has-danger',
        successClass: 'has-success',
        /* class of the parent element where error text element is appended */
        errorTextParent: 'contact__form-control',
        /* type of element to create for the error text */
        errorTextTag: 'div',
        /* class of the error text element */
        errorTextClass: 'contact__form-text-help' 
    };

    const form = document.getElementById("contact-form");
    if (!form) return;

    let pristine = new Pristine(form, pristineConfig);

    const the_select = document.getElementById('select-contact-method');
    const the_email_heading = document.getElementById('email-heading');
    const the_email = document.getElementById('email');
    const the_email_control = document.getElementById('email-control');
    const the_phone = document.getElementById('phone');
    const the_phone_control = document.getElementById('phone-control');
    const time_to_call = document.getElementById('time-to-call');
    const time_to_call_control = document.getElementById('time_to_call-control');
    const success_message = document.getElementById('contact__form-message--success');
    const error_message = document.getElementById('contact__form-message--error');
    
    function clear_messages(){
        const the_messages = document.querySelectorAll('.contact__form-message');
        the_messages.forEach(function(message){
            message.classList.add('hidden');
            message.textContent = '';
        });
    }

    if (the_select) {
        the_select.addEventListener('change', (event) => {
            $this = event.target;
            const the_value = $this.value;

            if(the_value == 'phone') {
                if (the_email) {
                    the_email.name = '';
                    the_email.value = '';
                    the_email.required = false;
                }
                if (the_email_heading) the_email_heading.classList.add('hidden');
                if (the_email_control) the_email_control.classList.add('hidden');
                
                if (the_phone) {
                    the_phone.required = true;
                    the_phone.name = 'phone';
                }
                if (time_to_call) {
                    time_to_call.required = true;
                    time_to_call.name = 'time_to_call';
                }
                if (the_phone_control) the_phone_control.classList.remove('hidden');
                if (time_to_call_control) time_to_call_control.classList.remove('hidden');
            }
            
            if(the_value == 'email') {
                if (the_phone) {
                    the_phone.required = false;
                    the_phone.name = '';
                }
                if (time_to_call) {
                    time_to_call.required = false;
                    time_to_call.name = '';
                }
                if (the_phone_control) the_phone_control.classList.add('hidden');
                if (time_to_call_control) time_to_call_control.classList.add('hidden');
                
                if (the_email) {
                    the_email.required = true;
                    the_email.name = 'email';
                }
                if (the_email_heading) the_email_heading.classList.remove('hidden');
                if (the_email_control) the_email_control.classList.remove('hidden');
            }
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        /* check if the form is valid */
        var valid = pristine.validate(); /* returns true or false */

        if(valid){
            const formData = new FormData(e.target);
            fetch("https://getform.io/f/bqoodwyb", {
                method: "POST",
                body: formData,
                headers: {
                    "Accept": "application/json",
                },
            })
            .then(response => {
                if (response.ok) {
                    clear_messages();
                    success_message.classList.remove('hidden');
                    success_message.textContent = '{{ site.data.global.contact.success_message }}';
                } else {
                    throw new Error(`An error occurred: ${response.statusText}`);
                }
            })
            .catch(error => {
                clear_messages();
                error_message.classList.remove('hidden');
                error_message.textContent = '{{ site.data.global.contact.error_message }}';
            });
        } else {
            clear_messages();
            error_message.classList.remove('hidden');
            error_message.textContent = '{{ site.data.global.contact.validation_error }}';
        }
 
     });

}

function initValidation(){

    var form = document.getElementById("contact-form");

    let pristineConfig = {
        /* class of the parent element where the error/success class is added */
        classTo: 'contact__form-control',
        errorClass: 'has-danger',
        successClass: 'has-success',
        /* class of the parent element where error text element is appended */
        errorTextParent: 'contact__form-control',
        /* type of element to create for the error text */
        errorTextTag: 'div',
        /* class of the error text element */
        errorTextClass: 'contact__form-text-help' 
    };
    
    /* create the pristine instance */
    var pristine = new Pristine(form, pristineConfig);

    form.addEventListener('submit', function (e) {
       e.preventDefault();
       
       /* check if the form is valid */
       var valid = pristine.validate(); /* returns true or false */

    });

}

handle_form_behavior()