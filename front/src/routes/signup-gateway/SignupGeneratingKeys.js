import style from './spinner.css';

const SignupGeneratingKeys = ({ children, ...props }) => (
  <div onSubmit={props.validateForm} className="card" style={{ height: '250px' }}>
    <div className="card-body p-6">
      <div className="card-title" style={{ textAlign: 'center' }}>
        {!props.signupCompleted && 'Generating your public/private keys...'}
        {props.signupCompleted && !props.token && 'Done! Please check your emails.'}
        {props.signupCompleted && props.token && (
          <p>
            Done! You can now login{' '}
            <a href="/login" style="color: blue">
              here
            </a>
            .
          </p>
        )}
      </div>
      {!props.signupCompleted && <div class={style.spWave + ' ' + style.sp} />}

      {props.signupCompleted && (
        <div class={style['circle-loader'] + ' ' + style['load-complete']}>
          <div class={style.checkmark + ' ' + style.draw} />
        </div>
      )}
      <div />
    </div>
  </div>
);

export default SignupGeneratingKeys;
