<template>
  <div class="TokenChart">
    <div class="TokenChart-chartContainer">
      <div class="TokenChart-chartMask">
        <svg id="chart" preserveAspectRatio="xMinYMin meet" viewBox="0 0 200 200"></svg>
        <div class="TokenChart-chartShadow">
        </div>
      </div>
      <div class="TokenChart-chartImage">
      </div>
    </div>
    <div class="TokenChart-labels">
      <dl class="TokenChart-list">
        <div
          v-for="(d, i) in data"
          :key="i"
          ref="labelValueWrapper"
          class="TokenChart-labelValueWrapper"
          :data-name="d.name"
          :class="`TokenChart-labelValueWrapper--${d.name}`"
        >
            <dt class="TokenChart-label text-xl">
              <i class="TokenChart-labelColor" :style="{backgroundColor: d.color}"/>
              {{ $t(`tokenChart.label.${d.name}`) }}
            </dt>
            <dd class="TokenChart-value text-xl">{{d.value}}%</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin';

export default {
  name: 'TokenChart',
  
  mixins: [ScrollAnimation],

  data() {
    return {
      data: [
        {value: 75, name: 'liquidity', color: '#FFFFFF'}, 
        {value: 10, name: 'team', color: '#9DD9D2'},
        {value: 10, name: 'marketing', color: '#c8a058'},
        {value: 5, name: 'cex', color: '#fcff5b'},
      ],
      listener: null,
    }
  },
  mounted() {
    this.data = this.data.sort((a, b) => b.value - a.value);
    if(this.helpers.isMobile()) {
      this.initChartMobile();
    } else {
      addEventListener('scroll', this.onViewport);
    }
  },
  
  methods: {
    onViewport() {
      if(this.helpers.isInViewport('#chart')) {
        this.initChart();
        removeEventListener('scroll', this.onViewport);
      }
    },
    
    dimList(exclude) {
      this.$refs.labelValueWrapper.forEach((ref) => {
        if (ref.dataset.name !== exclude) {
          ref.classList.add('is-dimmed');
        }
      })
    },

    undimList() {
      this.$refs.labelValueWrapper.forEach((ref) => {
          ref.classList.remove('is-dimmed');
      })
    },

    initChart() {
      const sizes = {
        innerRadius: 0,
        outerRadius: 100
      };

      const durations = {
        entryAnimation: this.helpers.isMobile() ? 10 : 2000
      };

      this.draw(sizes, durations);
    },

    draw(sizes, durations) {
      d3.select("#chart").html("");
      
      let generator = d3.pie()
        .value((d) => d.value)
        .sort((a, b) => {
          return a.value - b.value;
        });

      let chart = generator(this.data);

      let arcs = d3.select("#chart")
        .append("g")
        .attr("transform", "translate(100, 100)")
        .selectAll("path")
        .data(chart)
        .enter()
        .append("path")
        .style("fill", (d) => d.data.color)
        .attr('id', (d) => d.data.name)
        .on('mouseover', (d) => {
          this.dimList(d.target.id);
        })
        .on('mouseout', () => {
          this.undimList();
        });

      let angleInterpolation = d3.interpolate(generator.startAngle()(), generator.endAngle()());

      let innerRadiusInterpolation = d3.interpolate(0, sizes.innerRadius);
      let outerRadiusInterpolation = d3.interpolate(sizes.outerRadius, sizes.outerRadius);

      let arc = d3.arc();
      
      arcs.transition()
        .duration(durations.entryAnimation)
        .attrTween("d", d => {
          let originalEnd = d.endAngle;
          return t => {
            let currentAngle = angleInterpolation(t);
            if (currentAngle < d.startAngle) {
              return "";
            }

            d.endAngle = Math.min(currentAngle, originalEnd);

            return arc(d);
          };
        });

      d3.select("#chart")
        .transition()
        .duration(durations.entryAnimation)
        .tween("arcRadii", () => {
          return t => arc
            .innerRadius(innerRadiusInterpolation(t))
            .outerRadius(outerRadiusInterpolation(t));
        });
      
    },

    initChartMobile() {
      const width = 300;
      const data = this.data;

      const height = Math.min(width, 500);
      const radius = Math.min(width, height) / 2;

      const arc = d3.arc()
          .innerRadius(radius * 0.6)
          .outerRadius(radius - 1);

      const pie = d3.pie()
          .padAngle(1 / radius)
          .sort(null)
          .value(d => d.value);

      const svg = d3.select("#chart").html("")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [-width / 2, -height / 2, width, height])
          .attr("style", "max-width: 100%; height: auto;");

      svg.append("g")
        .selectAll()
        .data(pie(data))
        .join("path")
        .attr("fill", d => d.data.color)
        .attr("d", arc)
        .attr('id', (d) => d.data.name)
        .on('mouseover', (d) => {
          this.dimList(d.target.id);
        })
        .on('mouseout', () => {
          this.undimList();
        });
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/breakpoints';

$width: 350px;
$height: 350px;

.TokenChart {
  display: flex;
  gap: 12px;
  align-items: end;

  @include sm-down {
    flex-direction: column;
    align-items: unset;
    gap: 0;
  }
  
  &-chartContainer {
    position: relative;
    width: $width;
    height: $height;
    
    @include sm-down {
      transform: scale(0.8) translateY(-30px);
      margin: 0 auto;
    }
  }

  &-chartMask {
    mask-image: url('@/assets/images/chart-mask.svg');
    mask-size: contain;
    mask-repeat: no-repeat;
    position: relative;
  }

  &-chartShadow,
  &-chartImage {
    background-size: contain;
    background-repeat: no-repeat;
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &-chartImage {
    background-image: url('@/assets/images/raindr0p.png');
    background-position: 55% center;
  }
  
  &-labelValueWrapper {
    margin-bottom: 12px;
    display: flex;
    gap: 12px; 
    align-items: center;
    transition: opacity 300ms ease-in-out;

    &.is-dimmed {
      opacity: 0.3;
    }

    @include sm-down {
      margin-bottom: 0;
    }
  }

  &-labelColor {  
    display: inline-block;
    width: 40px;
    height: 40px;
    mask-image: url('@/assets/images/chart-label-mask.svg');
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;

    @include sm-down {
      width: 20px;
      height: 20px;
    }
  }

  &-label {
    align-items: center;
    color: $white;
    display: flex;
    gap: 12px;

    @include sm-down {
      font-size: 18px;
      gap: 8px;
    }
  }
  
  &-value {
    color: $white;
    font-weight: 700;
    margin: 0;
    
    @include sm-down {
      font-size: 18px;
    }
  }

  &-list {
    @include sm-down {
      display: flex; 
      flex-wrap: wrap;
      gap: 4px 18px;
      transform: translateY(-50px);
    }
  }
}

#chart {
  display: block;
  margin: 0 auto;
  height: $height;
  width: $width;
}
</style>