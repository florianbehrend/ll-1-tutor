import { Link } from "react-router-dom";

// StartPage component
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
        <div>
          <div className="flex justify-center flex-col items-center -mb-40 mt-40">
            <svg width="120" height="63" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73 38">
              <path d="M28 0v31h8V0h37v38h-7V7h-8v31h-7V7h-8v31H21V7h-7v31H7V7H0V0h28z" fill="rgb(48, 112, 179)">
              </path>
            </svg>
            <div className="text-sm">
              <p>Technical University of Munich</p>
              <br></br>
              <p>Bachelor thesis in computer science at the Chair of Formal Languages, Compiler Construction, Software Construction</p>
              <p>By Florian Behrend, advised by Dr. Michael Petter</p>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

export default StartPage;