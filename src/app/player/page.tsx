'use client'

export default function Player() {
	const joinSession = (formData: FormData) => {
		const sessionCode = formData.get('sessionCode')
		console.log(`Join session pressed with session code: ${sessionCode} `)
		alert(`You searched for '${sessionCode}'`)
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
			<main className='flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-12 px-4 bg-white dark:bg-black '>
				<div className='flex flex-col w-full items-center justify-center'>
					<div className='flex w-full h-15 rounded-md items-center mb-10 justify-between'>
						<div className='flex h-15 bg-orange-400 rounded-md justify-center items-center'>
							<h3 className='text-center'>PROFILE IMAGES</h3>
						</div>
						<div className='flex h-15 bg-orange-400 rounded-md justify-center items-center'>
							<h3 className='text-center'>MY PROFILE</h3>
						</div>
					</div>
					<div className='w-full h-15 bg-pink-400 rounded-md flex items-center justify-center mb-10'>
						<h3 className='text-center'>UP NEXT</h3>
					</div>
					<div className='w-full h-40 bg-indigo-400 rounded-md flex items-center justify-center mb-10'>
						<h3 className='text-center'>CURRENTLY PLAYING IMAGE</h3>
					</div>
					<div className='w-full h-20 bg-green-400 rounded-md flex items-center justify-center'>
						<h3 className='text-center'>SPOTIFY SDK HERE</h3>
					</div>
				</div>
				<form
					action={joinSession}
					className='flex flex-col items-center justify-center w-full px-8'
				>
					<input
						name='sessionCode'
						type='text'
						placeholder='Enter Song Url'
						className='w-full border border-gray-300 text-center placeholder:text-center px-3 py-2 mb-4 rounded-md'
					/>
					<button
						type='submit'
						className='w-full h-8 px-2 rounded-md bg-blue-950 text-white mb-4'
					>
						Queue Song
					</button>
				</form>
			</main>
		</div>
	)
}
