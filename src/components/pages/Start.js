import { Link } from "react-router-dom";


const StartPage = () => {

    return (
        <div className="App bg-zinc-900 flex justify-center">
        <header className="App-header">
          <h1 className='text-yellow-200 text-8xl font-bold leading-snug'>LL(1)</h1>
          <h1 className='text-yellow-200 text-xl font-thin'>Tutor</h1>
          <p className='mt-8'>
            Click <code>Start</code> to run the LL(1)-Tutor.
          </p>
          <div className='mt-8 rounded-lg bg-yellow-200 hover:bg-yellow-300 w-1/6 content-center flex justify-center'>
            <Link to={'/tutor'} className='text-zinc-900 w-full'>Start</Link>
          </div>
        </header>
      </div>
    )
}

export default StartPage