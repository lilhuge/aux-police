'use client'

import Image from 'next/image'

export default function Home() {
	const joinSession = (formData: FormData) => {
		const sessionCode = formData.get('sessionCode')
		console.log(`Join session pressed with session code: ${sessionCode} `)
		alert(`You searched for '${sessionCode}'`)
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
			<main className='flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-8 px-4 bg-white dark:bg-black '>
				<Image
					className='w-full h-auto dark:invert'
					src='/hero.svg'
					alt='Aux Police Hero Icon'
					width={600}
					height={600}
					sizes='100vw'
					priority
				/>
				<div className='flex flex-col items-center justify-center'>
					<form
						action={joinSession}
						className='flex flex-col items-center justify-center'
					>
						<input
							name='sessionCode'
							type='text'
							placeholder='Enter Session Code'
							className='w-full border border-gray-300 text-center placeholder:text-center px-3 py-2 rounded-md'
						/>
						<button
							type='submit'
							className='w-full px-2 rounded-md bg-blue-950 text-white'
						>
							Join Session
						</button>
					</form>
					<button
						type='button'
						className='w-full px-2 rounded-md bg-blue-950 text-white'
					>
						Start Session
					</button>
				</div>

				{/* <div className='flex flex-col items-center gap-6 text-center sm:items-start sm:text-left'>
					<h1 className='max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50'>
						To get started, edit the page.tsx file.
					</h1>
					<p className='max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400'>
						Looking for a starting point or more instructions? Head over to{' '}
						<a
							href='https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
							className='font-medium text-zinc-950 dark:text-zinc-50'
						>
							Templates
						</a>{' '}
						or the{' '}
						<a
							href='https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
							className='font-medium text-zinc-950 dark:text-zinc-50'
						>
							Learning
						</a>{' '}
						center.
					</p>
				</div> */}
				{/* <div className='flex flex-col gap-4 text-base font-medium sm:flex-row'>
					<a
						className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]'
						href='https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
						target='_blank'
						rel='noopener noreferrer'
					>
						<Image
							className='dark:invert'
							src='/vercel.svg'
							alt='Vercel logomark'
							width={16}
							height={16}
						/>
						Deploy Now
					</a>
					<a
						className='flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]'
						href='https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
						target='_blank'
						rel='noopener noreferrer'
					>
						Documentation
					</a>
				</div> */}
			</main>
		</div>
	)
}
