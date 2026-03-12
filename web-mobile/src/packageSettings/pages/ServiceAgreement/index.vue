<template>
  <Layouts>
    <view :class="pageStyle['service-agreement']">
      <view :class="pageStyle['policy-header']">
        <view :class="pageStyle['policy-title']">推敲AI用户服务协议</view>
      </view>

      <view :class="pageStyle['policy-content']">
        <text :class="pageStyle['policy-intro']">
          欢迎您使用推敲AI产品及相关服务！为了更好地为您提供服务，请您仔细阅读并充分理解本《推敲AI用户服务协议》（以下简称"本协议"）的各项条款，特别是免除或者限制责任的条款、法律适用和争议解决条款。
        </text>

        <text :class="pageStyle['policy-intro']">
          本协议是您与推敲AI之间关于您使用推敲AI产品及相关服务所订立的协议。"推敲AI"是指推敲AI平台的经营者，包括但不限于推敲AI网站、推敲AI移动应用程序等。
        </text>

        <view :class="pageStyle['policy-divider']"></view>

        <view :class="pageStyle['policy-chapter']">一、协议的范围</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.本协议是您与推敲AI之间关于您使用推敲AI产品及相关服务所订立的协议。</text>
          <text>2.本协议描述推敲AI与您之间关于"推敲AI"服务相关方面的权利义务。"推敲AI"服务是指推敲AI向您提供的包括但不限于AI设计、AI创作、AI问答等在内的产品及服务。</text>
          <text>3.本协议可由推敲AI随时更新，更新后的协议条款一旦公布即代替原来的协议条款，恕不再另行通知，您可在推敲AI平台查阅最新版协议条款。在推敲AI修改协议条款后，如果您不接受修改后的条款，请立即停止使用推敲AI提供的服务，您继续使用推敲AI提供的服务将被视为接受修改后的协议。</text>
          <text>4.本协议内容同时包括推敲AI可能不断发布的关于本服务的相关协议、业务规则等内容。上述内容一经正式发布，即为本协议不可分割的组成部分，您同样应当遵守。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">二、关于本服务</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.本服务的具体内容由推敲AI根据实际情况提供，包括但不限于AI设计、AI创作、AI问答等。推敲AI保留随时变更、中断或终止部分或全部服务的权利。</text>
          <text>2.推敲AI在提供服务时，可能会对部分服务收取一定的费用。对于收费的服务，推敲AI会在您使用之前给予明确的提示，只有您根据提示确认愿意支付相关费用，您才能使用该等收费服务。如您拒绝支付该等费用，则推敲AI有权不向您提供该等收费服务。</text>
          <text>3.您理解并同意，推敲AI仅向您提供相关的网络服务，除此之外与相关网络服务有关的设备（如个人电脑、手机、及其他与接入互联网或移动网有关的装置）及所需的费用（如为接入互联网而支付的电话费及上网费、为使用移动网而支付的手机费）均应由您自行负担。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">三、使用规则</view>
        <view :class="pageStyle['policy-section']">1.用户保证</view>
        <view :class="pageStyle['policy-ol']">
          <text>（1）您保证，您具有完全民事行为能力，能够独立承担民事责任。如果您不具备前述主体资格，请在法定监护人的陪同下阅读本协议，并特别注意未成年人使用条款。</text>
          <text>（2）您保证，您使用推敲AI产品及相关服务的行为必须合法。您不得为任何非法目的而使用推敲AI产品及相关服务，也不得以任何非法方式使用推敲AI产品及相关服务。</text>
          <text>（3）您保证，您在使用推敲AI产品及相关服务时将遵守国家法律法规、行政规章以及规范性文件的规定，不会利用推敲AI产品及相关服务进行任何违法或不当活动。</text>
          <text>（4）您保证，您不会干扰或混乱推敲AI产品及相关服务。</text>
          <text>（5）您保证，您不会损害推敲AI的名誉。</text>
          <text>（6）您保证，无论何种原因，您使用推敲AI产品及相关服务时不会进行任何危害计算机网络安全的行为，包括但不限于：使用未经许可的数据或进入未经许可的服务器/帐户；未经允许进入公众计算机网络或者他人计算机系统并删除、修改、增加存储信息；未经许可，企图探查、扫描、测试本"软件"系统或网络的弱点或其它实施破坏网络安全的行为；企图干涉、破坏本"软件"系统或网站的正常运行，故意传播恶意程序或病毒以及其他破坏干扰正常网络信息服务的行为；伪造TCP/IP数据包名称或部分名称。</text>
          <text>（7）您保证，您不会制作、发布、传播、存储违反国家法律法规禁止的内容：</text>
          <view :class="pageStyle['policy-ol']" type="a">
            <text>（a）违反宪法确定的基本原则的；</text>
            <text>（b）危害国家统一、主权和领土完整的；</text>
            <text>（c）泄露国家秘密、危害国家安全或者损害国家荣誉和利益的；</text>
            <text>（d）煽动民族仇恨、民族歧视，破坏民族团结，或者侵害民族风俗、习惯的；</text>
            <text>（e）破坏国家宗教政策，宣扬邪教、迷信的；</text>
            <text>（f）散布谣言，扰乱社会秩序，破坏社会稳定的；</text>
            <text>（g）散布淫秽、色情、赌博、暴力、恐怖或者教唆犯罪的；</text>
            <text>（h）侮辱或者诽谤他人，侵害他人合法权益的；</text>
            <text>（i）危害社会公德或者民族优秀文化传统的；</text>
            <text>（j）有法律、行政法规和国家规定禁止的其他内容的。</text>
          </view>
          <text>（8）您保证，您不会对推敲AI产品及相关服务中包含的版权、商标权等知识产权以及其他权利进行修改、出租、出借、出售、散布或者创造与内容有关的派生产品，或通过信息网络向公众传播，或者以其他方式进行商业性使用。</text>
          <text>（9）未经公司书面许可，任何用户、第三方不得以任何方式（包括但不限于盗链、冗余盗取、非法抓取、模拟下载、深度链接、假冒注册等）直接或间接盗取推敲AI产品及相关服务的视频、图文等信息内容，或以任何方式（包括但不限于隐藏或者修改域名、平台特有标识、用户名等）删除或改变相关信息内容的权利管理电子信息。</text>
          <text>（10）经公司书面许可后，用户、第三方对推敲AI产品及相关服务的信息内容的分享、转发等行为，还应符合以下规范：</text>
          <view :class="pageStyle['policy-ol']" type="a">
            <text>（a）不得对推敲AI产品及相关服务的源网页进行任何形式的任何改动，包括但不限于推敲AI产品及相关服务的首页链接、广告系统链接等入口，也不得对推敲AI产品及相关服务的源页面的展示进行任何形式的遮挡、插入、弹窗等妨碍；</text>
            <text>（b）应当采取安全、有效、严密的措施，防推敲AI产品及相关服务的信息内容被第三方通过包括但不限于"蜘蛛"（spider）程序等任何形式进行非法获取；</text>
            <text>（c）不得把相关数据内容用于公司书面许可范围之外的目的，进行任何形式的销售和商业使用，或向第三方泄露、提供或允许第三方为任何方式的使用。</text>
          </view>
          <text>（11）用户违反上述任何一款的保证，推敲AI均有权就其情节，对其做出警告、屏蔽、直至取消资格的处理；如因用户违反上述保证而给推敲AI产品服务、推敲AI产品服务用户或推敲AI的任何合作伙伴造成损失，用户自行负责承担一切法律责任并赔偿损失；如相关机构判令推敲AI对此承担责任的，推敲AI有权向您追偿。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">四、账号注册与管理</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.您需要注册一个账号才能使用推敲AI的部分服务。您应当使用真实、准确、完整的信息注册账号，并及时更新注册信息。</text>
          <text>2.您应当妥善保管您的账号和密码，不得将账号出借、转让或以其他方式提供给他人使用。</text>
          <text>3.如发现您的账号被他人非法使用，您应当立即通知推敲AI。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">五、隐私保护</view>
        <text :class="pageStyle['policy-text']">推敲AI非常重视用户隐私保护。关于我们如何收集、使用、存储和保护您的个人信息，请参阅我们的《隐私政策》。</text>

        <view :class="pageStyle['policy-chapter']">六、费用与支付</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.推敲AI的部分服务可能需要付费。具体的收费标准和支付方式将在相关服务页面明确说明。</text>
          <text>2.您应当按照约定支付相关费用。如未按时支付，推敲AI有权暂停或终止向您提供相关服务。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">七、服务的变更、中断或终止</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.推敲AI保留随时变更、中断或终止部分或全部服务的权利，无需事先通知。</text>
          <text>2.因系统维护、升级或其他原因需要暂停服务时，推敲AI将尽量提前通知。</text>
          <text>3.如因不可抗力等原因导致服务中断，推敲AI不承担责任。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">八、知识产权</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.推敲AI平台上的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、版面设计等，均受知识产权法律保护。</text>
          <text>2.未经推敲AI书面许可，您不得复制、传播、展示、镜像、上载、下载推敲AI平台上的任何内容。</text>
          <text>3.您通过推敲AI平台创作的内容，其知识产权归属按照相关法律法规和本协议约定确定。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">九、免责声明</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.推敲AI不保证服务不会中断，不保证服务的及时性、安全性、准确性。</text>
          <text>2.您使用推敲AI服务的风险由您自行承担。</text>
          <text>3.推敲AI不对因使用或无法使用服务而导致的任何损失承担责任。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">十、违约责任</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.如您违反本协议，推敲AI有权采取包括但不限于警告、限制功能、暂停服务、终止服务等措施。</text>
          <text>2.如因您的违约行为给推敲AI造成损失，您应当承担赔偿责任。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">十一、协议的修改</view>
        <text :class="pageStyle['policy-text']">推敲AI有权随时修改本协议。修改后的协议将在推敲AI平台公布，自公布之日起生效。如您不同意修改后的协议，应当停止使用推敲AI服务。</text>

        <view :class="pageStyle['policy-chapter']">十二、法律适用与争议解决</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.本协议的签订、履行、解释均适用中华人民共和国法律。</text>
          <text>2.因本协议产生的争议，双方应友好协商解决；协商不成的，可向推敲AI所在地人民法院提起诉讼。</text>
        </view>

        <view :class="pageStyle['policy-chapter']">十三、其他</view>
        <view :class="pageStyle['policy-ol']">
          <text>1.本协议构成您与推敲AI之间的完整协议。</text>
          <text>2.如本协议的任何条款被认定为无效，不影响其他条款的效力。</text>
          <text>3.推敲AI对本协议享有最终解释权。</text>
        </view>

        <view :class="pageStyle['policy-divider']"></view>

        <text :class="pageStyle['footer']">深圳市星元云创科技有限公司</text>
        <text :class="pageStyle['footer']">2025年08月06日</text>
      </view>
    </view>
  </Layouts>
</template>

<style lang="less">
</style>

<script setup lang="ts">
import pageStyle from './index.module.less'
import Layouts from "@/components/Layouts/index.vue";

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>
