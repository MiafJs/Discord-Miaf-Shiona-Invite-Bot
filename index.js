const { Collection, MessageEmbed, Client } = require('discord.js');
const Mongoose = require('mongoose');
const moment = require('moment');
const Settings = client.Settings
const Bot = new Client();
const invites = {};
const queue = require('util').promisify(setTimeout);
client.Settings = { 

    
        "ServerID": "",
        "DatabaseName": "ShinoaManager",
        "Token": "",
        "Prefix": "miaf!",
        "Channel": ""
    

}

Mongoose.connect('mongo connect', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

// 

const MiafSchema = Mongoose.Schema({
    memberID: { type: String, default: null },
    inviterID: { type: String, default: null },
    Total: { type: Number, default: 0 },
    basarili: { type: Number, default: 0 },
    basarisiz: { type: Number, default: 0 },
    Fake: { type: Boolean, default: false }
});
const ShinoaMiafData = Mongoose.model('MiafShinoaData', MiafSchema);
const Invites = new Collection();

Bot.on('ready', () => {
    queue(2000)
    Bot.user.setPresence({ activity: { name: "Miaf ❤️ Shinoa" }, status: "dnd" });
    Bot.guilds.cache.get(Settings.ServerID).fetchInvites().then(x => Invites.set(x.first().guild.id, x));
});

Bot.on('inviteCreate', (invite) => {
    const Set = Invites.get(invite.guild.id);
    Set.set(invite.code, invite);
    Invites.set(invite.guild.id, Set);
});

Bot.on('inviteDelete', (invite) => {
    const Set = Invites.get(invite.guild.id);
    Set.delete(invite.code);
    Invites.set(invite.guild.id, Set);
});

Bot.on('guildMemberAdd', async (member) => {
    if (member.user.bot) return;
    const Set = (Invites.get(member.guild.id) || new Collection()).clone();
    const Sunucu = member.guild
    const Fake = Date.now() - member.user.createdTimestamp < Settings.FakeDays ? true : false;
    const IC = Sunucu.channels.cache.get(Settings.Channel);

    Sunucu.fetchInvites().then(async invites => {
        const invite = invites.find(index => Set.has(index.code) && Set.get(index.code).uses < index.uses) || Set.find(values => !invites.has(values.code)) || Sunucu.vanityURLCode;
        Invites.set(Sunucu.id, invites);
        let basarili = 0
        let mesajIcerik = `${member} sunucuya giriş yaptı.`;

        if (invite.inviter && invite.inviter.id !== member.id) {
            const Database = await ShinoaMiafData.findOne({ memberID: invite.inviter.id }) || new ShinoaMiafData({ memberID: invite.inviter.id });
            if (Fake) Database.basarisiz += 1;
            else basarili = Database.basarili += 1;
            Database.Total += 1;
            Database.save();
            ShinoaMiafData.findOneAndUpdate({ memberID: member.id }, { $set: { inviterID: invite.inviter.id, Fake: Fake } }, { upsert: true, setDefaultsOnInsert: true }).exec();
        }

        if (IC) {
            if (invite === Sunucu.vanityURLCode) mesajIcerik = `${member} sunucuya özel urlyi kullanarak girdi!`;
            else if (invite.inviter.id === member.id) mesajIcerik = `${member} kendi daveti ile sunucuya giriş yaptı.`
            else mesajIcerik = `${member} katıldı! **Davet eden**: ${invite.inviter.tag} \`(${basarili} davet)\` ${Fake ? ':<a:biptal:823686669865058328> :' : '<a:bonay1:823686763683774484> '}`;
            IC.send(mesajIcerik);
        }

    }).catch(console.error);
});

Bot.on('guildMemberRemove', async (member) => {
    if (member.user.bot) return;
    let basarili = 0 
    let mesajIcerik = `${member} sunucudan ayrıldı.`;
    const MemberData = await ShinoaMiafData.findOne({ memberID: member.id }) || {}
    let IC = member.guild.channels.cache.get(Settings.Channel);

    if (!MemberData && IC) return Channel.send(mesajIcerik);

    const Database = await ShinoaMiafData.findOne({ memberID: MemberData.inviterID }) || new ShinoaMiafData({ memberID: MemberData.inviterID });

    if (MemberData.Fake === true && data.inviterID && Database.basarisiz > 0) Database.basarisiz -= 1;
    else if (MemberData.inviterID && Database.basarili > 0) Database.basarili -= 1;
    basarili = Database.basarili
    Database.Total -= 1;
    Database.save();

    const InviterMember = member.guild.member(MemberData.inviterID);

    if (IC) {
        mesajIcerik = `${member} sunucudan ayrıldı. ${InviterMember ? `**Davet eden**: ${InviterMember.user.tag} \`(${basarili} davet)\`` : 'Davetçi bulunamadı!'}`;
        IC.send(mesajIcerik);
    }
});

Bot.on('message', async (message) => {
    if (message.author.bot || (message.channel.type === 'dm' && !message.guild) || !message.content.startsWith(Settings.Prefix)) return;

    const embed = new MessageEmbed().setColor(message.member.displayHexColor);
    const args = message.content.slice(Settings.Prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'invite' || command === 'invites' || command === 'davetler' || command === 'davet') {
        const Member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const Database = await ShinoaMiafData.findOne({ memberID: Member.id }) || { Total: 0, basarili: 0, basarisiz: 0 };
        if (Database.Total) {
            embed.setDescription(`${Member.id === message.author.id ? 'Senin' : `**${Member.user.tag}** sahip olduğun`} \`${Database.Total}\` davetin var. (\`${Database.basarili}\` Başarılı Davet, \`${Database.basarisiz}\` Başarısız Davet)`);
        } else {
            embed.setDescription(`<a:biptal:823686669865058328>  Kullanıcının verilerini bulamadım.`);
        }
        embed.setAuthor(Member.user.tag, Member.user.avatarURL({ dynamic: true }), `https://discord.com/users/${Member.id}`);
        message.channel.send(embed);
    }  else if (command === 'top10' || command === 'top' || command === 'topinv' || command === 'topdavet' || command === 'sıralama') {
        const InviteTop = await ShinoaMiafData.find({}).exec();
        if (!InviteTop || !InviteTop.length) return message.channel.send(embed.setDescription('Sunucunuzda davet yapan hiç üye yok.'));
        const tops = InviteTop.filter(x => x.Total !== 0 && x.Id).sort((x,y) => y.Total - x.Total).map((value,index)=> `**${index+1}.** <@${value.Id}> • \`${value.Total}\` davet (\`${value.Unsuccessful}\` başarısız, \`${value.Successful}\` başarılı)`).slice(0, 10)

        await message.channel.send(embed.setDescription(`${topls.join('\n')}`).setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true })));
    }
});

Bot.login(Settings.Token).then(() => console.log(`[INVITE] ${Bot.user.tag} giriş yaptı!`)).catch(err => console.error('[INVITE] Bot bağlanırken sorun yaşandı!'));