const { create, Client } = require('@open-wa/wa-automate')
const figlet = require('figlet')
const options = require('./utils/options')
const { color, messageLog } = require('./utils')
const HandleMsg = require('./HandleMsg')

const start = (mcpr = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('MCPR BOT', { font: 'Ghost', horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color('[DEV]'), color('MCPR', 'red'))
    console.log(color('[~>>]'), color('BOT Redy!', 'green'))

    // Mempertahankan sesi agar tetap nyala
    mcpr.onStateChanged((state) => {
        console.log(color('[~>>]', 'red'), state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') mcpr.forceRefocus()
    })

    // ketika bot diinvite ke dalam group
    mcpr.onAddedToGroup(async (chat) => {
	const groups = await mcpr.getAllGroups()
	// kondisi ketika batas group bot telah tercapai,ubah di file settings/setting.json
	if (groups.length > groupLimit) {
	await mcpr.sendText(chat.id, `Sorry, the group on this bot is full\nMax Group is: ${groupLimit}`).then(() => {
          mcpr.leaveGroup(chat.id)
	      mcpr.deleteChat(chat.id)
	  }) 
	} else {
	// kondisi ketika batas member group belum tercapai, ubah di file settings/setting.json
	    if (chat.groupMetadata.participants.length < memberLimit) {
	    await mcpr.sendText(chat.id, `Sorry, BOT comes out if the group members do not exceed ${memberLimit} people`).then(() => {
          mcpr.leaveGroup(chat.id)
	      mcpr.deleteChat(chat.id)
	    })
	    } else {
        await mcpr.simulateTyping(chat.id, true).then(async () => {
          await mcpr.sendText(chat.id, `Hai minna~, Im ${prefix}. To find out the commands on this bot type ${prefix}menu`)
        })
	    }
	}
    })

    // ketika seseorang masuk/keluar dari group
    mcpr.onGlobalParicipantsChanged(async (event) => {
        const host = await mcpr.getHostNumber() + '@c.us'
        // kondisi ketika seseorang diinvite/join group lewat link
        if (event.action === 'add' && event.who !== host) {
            await mcpr.sendTextWithMentions(event.chat, `Hello, Welcome to the group @${event.who.replace('@c.us', '')} \n\nHave fun with us✨`)
        }
        // kondisi ketika seseorang dikick/keluar dari group
        if (event.action === 'remove' && event.who !== host) {
            await mcpr.sendTextWithMentions(event.chat, `Good bye @${event.who.replace('@c.us', '')}, We'll miss you✨`)
        }
    })

    mcpr.onIncomingCall(async (callData) => {
        // ketika seseorang menelpon nomor bot akan mengirim pesan
        await mcpr.sendText(callData.peerJid, 'Maaf sedang tidak bisa menerima panggilan.\n\n-bot')
        .then(async () => {
            // bot akan memblock nomor itu
            await mcpr.contactBlock(callData.peerJid)
        })
    })

    // ketika seseorang mengirim pesan
    mcpr.onMessage(async (message) => {
        mcpr.getAmountOfLoadedMessages() // menghapus pesan cache jika sudah 3000 pesan.
            .then((msg) => {
                if (msg >= 3000) {
                    console.log('[mcpr]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    mcpr.cutMsgCache()
                }
            })
        HandleMsg(mcpr, message)    
    
    })
	
    // Message log for analytic
    mcpr.onAnyMessage((anal) => { 
        messageLog(anal.fromMe, anal.type)
    })
}

//create session
create(options(true, start))
    .then((mcpr) => start(mcpr))
    .catch((err) => new Error(err))
